import { z } from "zod";

export const LANGUAGES = ["en", "zh", "ko", "th"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export const localizedTextSchema = z.object({
  en: z.string().min(1, "English text is required"),
  zh: z.string().min(1, "Chinese text is required"),
  ko: z.string().min(1, "Korean text is required"),
  th: z.string().min(1, "Thai text is required"),
});

export const productSchema = z.object({
  id: z.string().uuid("Product id must be a valid UUID"),
  category: z.enum(["health", "cosmetic"]),
  pointValue: z
    .number()
    .int("Point value must be an integer")
    .min(0, "Point value cannot be negative"),
  tags: z.array(z.string().min(1)).default([]),
  image: z.string().url("Image must be a valid URL"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  effects: localizedTextSchema,
  sideEffects: localizedTextSchema,
  goodFor: localizedTextSchema,
  updatedAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime()),
});

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
    image: "",
    name: emptyLocalizedField(),
    description: emptyLocalizedField(),
    effects: emptyLocalizedField(),
    sideEffects: emptyLocalizedField(),
    goodFor: emptyLocalizedField(),
    updatedAt: nowIso,
  };
};
