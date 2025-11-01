import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveProduct, normalizeProductInput, buildBundle } from "@/lib/product-service";
import { LANGUAGES, type LanguageCode } from "@pdg/schema";

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
  })
  .refine((value) => Boolean(value.externalId || value.id), {
    message: "externalId or id is required.",
    path: ["externalId"],
  });

const trim = (value: string) => value.trim();

const dedupe = <T>(items: T[]): T[] => Array.from(new Set(items));

const buildProductPayload = (input: z.infer<typeof productLineSchema>) => {
  const timestamp = input.updatedAt ? new Date(input.updatedAt) : new Date();
  const updatedAt = Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString();

  const tags = dedupe(
    (input.tags ?? [])
      .map(trim)
      .filter((tag) => tag.length > 0),
  );

  return {
    id: input.externalId ?? input.id,
    category: "health" as const,
    pointValue: 0,
    name: input.name,
    description: input.description ?? {},
    effects: input.effects ?? {},
    sideEffects: input.sideEffects ?? {},
    goodFor: input.goodFor ?? {},
    tags,
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

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes(CONTENT_TYPE)) {
    return NextResponse.json({ error: `Content-Type must be ${CONTENT_TYPE}` }, { status: 415 });
  }

  const lines = await readLines(request);

  if (lines.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: [] });
  }

  const errors: Array<{ line: number; message: string }> = [];
  let imported = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    try {
      const parsed = productLineSchema.parse(JSON.parse(raw));
      const payload = buildProductPayload(parsed);
      const normalized = normalizeProductInput(payload);
      await saveProduct(normalized);
      imported += 1;
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

  if (imported > 0) {
    try {
      await buildBundle();
    } catch (error) {
      console.warn("Bundle rebuild failed after import:", error);
    }
  }

  return NextResponse.json({
    imported,
    skipped: errors.length,
    errors,
  });
}
