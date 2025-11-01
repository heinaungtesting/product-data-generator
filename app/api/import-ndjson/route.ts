import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sanitizeText } from "@/lib/lawSafe";
import {
  buildLocalizedGroups,
  persistProductGraph,
  updateProductsCursor,
  type NormalizedProduct,
} from "@/lib/pdgRepository";
import { getSupabaseAdminClient } from "@/lib/supabaseClient";

const CONTENT_TYPE = "application/x-ndjson";

const localizedRequiredSchema = z
  .object({
    ja: z.string().min(1),
    en: z.string().optional(),
    zh: z.string().optional(),
    th: z.string().optional(),
    ko: z.string().optional(),
  })
  .catchall(z.string().optional());

const localizedOptionalSchema = localizedRequiredSchema.partial();

const imageSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine((value) => {
      if (value.startsWith("data:")) {
        return true;
      }
      try {
        const parsed = new URL(value);
        return Boolean(parsed.protocol && parsed.host);
      } catch {
        return false;
      }
    }, "Image url must be a valid http(s) URL or data URI."),
  filename: z.string().optional(),
});

const productLineSchema = z
  .object({
    externalId: z.string().optional(),
    id: z.string().optional(),
    updatedAt: z.string().datetime().optional(),
    name: localizedRequiredSchema,
    description: localizedOptionalSchema.optional(),
    effects: localizedOptionalSchema.optional(),
    sideEffects: localizedOptionalSchema.optional(),
    goodFor: localizedOptionalSchema.optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(imageSchema).optional(),
  })
  .refine((value) => Boolean(value.externalId || value.id), {
    message: "externalId or id is required.",
    path: ["externalId"],
  });

const trim = (value: string) => value.trim();

const dedupe = <T>(items: T[]): T[] => Array.from(new Set(items));

const buildNormalizedProduct = (input: z.infer<typeof productLineSchema>): NormalizedProduct => {
  const externalId = trim(input.externalId ?? input.id ?? "");
  const timestamp = input.updatedAt ? new Date(input.updatedAt) : new Date();
  const updatedAt = Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString();
  const localized = buildLocalizedGroups({
    name: input.name,
    description: input.description ?? {},
    effects: input.effects ?? {},
    sideEffects: input.sideEffects ?? {},
    goodFor: input.goodFor ?? {},
  });

  if (!localized.name.ja) {
    throw new Error("name.ja cannot be empty after sanitization.");
  }

  const tags = dedupe(
    (input.tags ?? [])
      .map((tag) => sanitizeText(tag))
      .map(trim)
      .filter((tag) => tag.length > 0),
  );

  const images =
    input.images?.map((image) => ({
      source: trim(image.url),
      filename: image.filename ? trim(image.filename) : undefined,
    })) ?? [];

  return {
    externalId,
    localized,
    tags,
    images,
    updatedAt,
  };
};

const readLines = async (request: NextRequest) => {
  const body = await request.text();
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const signPayload = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

const postWebhook = async (cursor: string) => {
  const webhookUrl = process.env.PDG_WEBHOOK_URL;
  const webhookSecret = process.env.PDG_WEBHOOK_HMAC;
  if (!webhookUrl || !webhookSecret) {
    console.warn("PDG webhook configuration missing; skipping notification.");
    return;
  }
  const body = JSON.stringify({ cursor });
  const signature = signPayload(body, webhookSecret);
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pdg-signature": signature,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`PDG webhook failed with status ${response.status}: ${text}`);
  }
};

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes(CONTENT_TYPE)) {
    return NextResponse.json({ error: `Content-Type must be ${CONTENT_TYPE}` }, { status: 415 });
  }

  const supabase = getSupabaseAdminClient();
  const lines = await readLines(request);

  if (lines.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: [] });
  }

  const errors: Array<{ line: number; message: string }> = [];
  let imported = 0;
  let maxCursor: string | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    try {
      const parsed = productLineSchema.parse(JSON.parse(raw));
      const normalized = buildNormalizedProduct(parsed);
      const { cursor } = await persistProductGraph(supabase, normalized);
      imported += 1;
      if (!maxCursor || cursor > maxCursor) {
        maxCursor = cursor;
      }
    } catch (error) {
      const message =
        error instanceof z.ZodError
          ? error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ")
          : error instanceof Error
            ? error.message
            : "Unknown error";
      errors.push({ line: index + 1, message });
    }
  }

  if (maxCursor) {
    try {
      await updateProductsCursor(supabase, maxCursor);
      if (imported > 0) {
        await postWebhook(maxCursor);
      }
    } catch (error) {
      errors.push({
        line: 0,
        message: error instanceof Error ? `Cursor/Webhook failure: ${error.message}` : "Cursor/Webhook failure",
      });
    }
  }

  return NextResponse.json({
    imported,
    skipped: errors.length,
    errors,
  });
}
