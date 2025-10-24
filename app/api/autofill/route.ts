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
    "Each key must be an object containing the languages en, zh, ko, th with natural, culturally appropriate strings.",
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

export async function POST(req: NextRequest) {
  try {
    const { englishName } = (await req.json()) ?? {};

    if (typeof englishName !== "string" || englishName.trim().length === 0) {
      return NextResponse.json(
        { error: "englishName is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.AI_KEY;
    const apiUrl = process.env.AI_AUTOFILL_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: "Server missing AI configuration. Set AI_KEY and AI_AUTOFILL_URL." },
        { status: 500 },
      );
    }

    const url = new URL(apiUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let body: unknown = { englishName };

    if (url.host.includes(GOOGLE_API_HOST)) {
      headers["x-goog-api-key"] = apiKey;
      url.searchParams.set("key", apiKey);
      body = buildGoogleRequestBody(englishName);
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
