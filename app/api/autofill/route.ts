import { NextRequest, NextResponse } from "next/server";
import { LANGUAGES, localizedTextSchema } from "@/schema";
import { z } from "zod";

const autofillResponseSchema = z.object({
  description: localizedTextSchema,
  effects: localizedTextSchema,
  sideEffects: localizedTextSchema,
  goodFor: localizedTextSchema,
});

const GOOGLE_API_HOST = "generativelanguage.googleapis.com";

const googleResponseSchema = {
  type: "object",
  properties: Object.fromEntries(
    ["description", "effects", "sideEffects", "goodFor"].map((section) => [
      section,
      {
        type: "object",
        properties: Object.fromEntries(
          LANGUAGES.map((lang) => [lang, { type: "string", description: `${section}.${lang}` }]),
        ),
        required: [...LANGUAGES],
      },
    ]),
  ),
  required: ["description", "effects", "sideEffects", "goodFor"],
} as const;

const buildGooglePrompt = (englishName: string) =>
  [
    "You are assisting with multilingual product catalog descriptions.",
    `Generate localized marketing copy for the product named "${englishName}".`,
    "Return a JSON object with keys description, effects, sideEffects, and goodFor.",
    "Each key must be an object containing the languages ja, en, th, ko, zh with natural, culturally appropriate strings.",
    "English (en) should be original marketing text. Other languages should be fluent translations, not transliterations.",
    "Do not include any additional commentary or markdown.",
  ].join("\n");

const buildGoogleRequestBody = (englishName: string) => ({
  contents: [
    {
      role: "user",
      parts: [
        {
          text: buildGooglePrompt(englishName),
        },
      ],
    },
  ],
  generationConfig: {
    temperature: 0.5,
    responseMimeType: "application/json",
    responseSchema: googleResponseSchema,
  },
});

type GoogleCandidatePart = {
  text?: string;
};

type GoogleCandidate = {
  content?: {
    parts?: GoogleCandidatePart[];
  };
};

type GoogleRawResponse = {
  candidates?: GoogleCandidate[];
};

const extractGooglePayload = (payload: unknown) => {
  const candidate = (payload as GoogleRawResponse)?.candidates?.[0];
  const textPart = candidate?.content?.parts?.find(
    (part) => typeof part?.text === "string" && part.text.trim().length > 0,
  )?.text;

  if (!textPart) {
    throw new Error("Google AI response missing text part.");
  }

  try {
    return JSON.parse(textPart);
  } catch (error) {
    throw new Error(
      `Failed to parse Google AI response JSON: ${(error as Error).message ?? "Unknown error"}`,
    );
  }
};

type RateLimiterEntry = {
  count: number;
  windowStart: number;
};

const rateLimiter = new Map<string, RateLimiterEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_CALLS = 10;
const MAX_AUTOFILL_NAME_LENGTH = 150;

const allowRequest = (identifier: string) => {
  const now = Date.now();
  const existing = rateLimiter.get(identifier);

  if (!existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimiter.set(identifier, { count: 1, windowStart: now });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX_CALLS) {
    return false;
  }

  existing.count += 1;
  return true;
};

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    const { englishName } = (await req.json()) ?? {};

    if (typeof englishName !== "string" || englishName.trim().length === 0) {
      return NextResponse.json(
        { error: "englishName is required" },
        { status: 400 },
      );
    }

    if (englishName.length > MAX_AUTOFILL_NAME_LENGTH) {
      return NextResponse.json(
        {
          error: `englishName must be under ${MAX_AUTOFILL_NAME_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const sanitizedEnglishName = englishName.trim();

    const apiKey = process.env.AI_KEY;
    const apiUrl = process.env.AI_AUTOFILL_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: "Server missing AI configuration. Set AI_KEY and AI_AUTOFILL_URL." },
        { status: 500 },
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const clientIp = forwardedFor.split(",")[0]?.trim() || "anonymous";

    if (!allowRequest(clientIp)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in a moment." },
        { status: 429 },
      );
    }

    const url = new URL(apiUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let body: unknown = { englishName: sanitizedEnglishName };

    if (url.host.includes(GOOGLE_API_HOST)) {
      headers["x-goog-api-key"] = apiKey;
      url.searchParams.set("key", apiKey);
      body = buildGoogleRequestBody(sanitizedEnglishName);
    } else {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: "AI service failed",
          status: response.status,
          details: text.slice(0, 2000),
        },
        { status: response.status === 401 ? 401 : 502 },
      );
    }

    const rawPayload = await response.json().catch(async () => {
      const text = await response.text();
      throw new Error(`AI service returned non-JSON payload: ${text.slice(0, 500)}`);
    });

    const payload =
      url.host.includes(GOOGLE_API_HOST) ? extractGooglePayload(rawPayload) : rawPayload;

    const parsed = autofillResponseSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "AI service returned invalid structure",
          issues: parsed.error.flatten(),
        },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error("/api/autofill error", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
