import { z } from "zod";

export const LANGUAGES = ["en", "zh", "ko", "th"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

const createLocalizedTextSchema = (opts: { fieldLabel: string; maxLength: number }) =>
  z.object(
    Object.fromEntries(
      LANGUAGES.map((lang) => [
        lang,
        z
          .string()
          .min(1, `${opts.fieldLabel} (${lang.toUpperCase()}) is required`)
          .max(
            opts.maxLength,
            `${opts.fieldLabel} (${lang.toUpperCase()}) must be under ${opts.maxLength} characters`,
          )
          .refine((value) => value.trim().length > 0, {
            message: `${opts.fieldLabel} (${lang.toUpperCase()}) cannot be blank`,
          }),
      ]),
    ) as Record<LanguageCode, z.ZodString>,
  );

export const localizedTextSchema = createLocalizedTextSchema({
  fieldLabel: "Field",
  maxLength: 600,
});

export const localizedNameSchema = createLocalizedTextSchema({
  fieldLabel: "Name",
  maxLength: 150,
});

export const productSchema = z.object({
  id: z.string().uuid("Product id must be a valid UUID"),
  category: z.enum(["health", "cosmetic"]),
  pointValue: z
    .number()
    .int("Point value must be an integer")
    .min(0, "Point value cannot be negative")
    .max(1_000_000, "Point value is unexpectedly large"),
  tags: z
    .array(
      z
        .string()
        .min(1)
        .max(40, "Tag length must be under 40 characters")
        .refine((tag) => !/\s{2,}/.test(tag), {
          message: "Tags cannot contain repeated whitespace",
        }),
    )
    .max(25, "Too many tags specified")
    .default([]),
  name: localizedNameSchema,
  description: localizedTextSchema,
  effects: localizedTextSchema,
  sideEffects: localizedTextSchema,
  goodFor: localizedTextSchema,
  updatedAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime()),
}).passthrough();

export const productPayloadSchema = z.object({
  products: z.array(productSchema),
  purchaseLog: z.array(z.unknown()),
});

export type Product = z.infer<typeof productSchema>;
export type ProductPayload = z.infer<typeof productPayloadSchema>;

export const emptyLocalizedField = (): Record<LanguageCode, string> => ({
  en: "",
  zh: "",
  ko: "",
  th: "",
});

export const createEmptyProduct = (): Product => {
  const nowIso = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    category: "health",
    pointValue: 0,
    tags: [],
    name: emptyLocalizedField(),
    description: emptyLocalizedField(),
    effects: emptyLocalizedField(),
    sideEffects: emptyLocalizedField(),
    goodFor: emptyLocalizedField(),
    updatedAt: nowIso,
  };
};
