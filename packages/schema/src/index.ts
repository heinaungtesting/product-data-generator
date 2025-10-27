import { z } from "zod";

export const SCHEMA_VERSION = "2024.10.26";

export const LANGUAGES = ["ja", "en", "th", "ko"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export const MAX_NAME_LENGTH = 150;
export const MAX_TEXT_LENGTH = 600;

const BANNED_JP_PATTERN = /(?:治る|治癒|効く|がん|糖尿病|高血圧)/u;
const BANNED_JP_MESSAGE =
  "Japanese copy cannot include regulated medical claims (治る·治癒·効く·がん·糖尿病·高血圧).";

const buildFieldSchema = (fieldLabel: string, maxLength: number) =>
  z
    .string()
    .min(1, `${fieldLabel} is required`)
    .max(maxLength, `${fieldLabel} must be under ${maxLength} characters`)
    .refine((value) => value.trim().length > 0, {
      message: `${fieldLabel} cannot be blank`,
    });

const withJapaneseBan = (schema: z.ZodString) =>
  schema.refine((value) => !BANNED_JP_PATTERN.test(value), {
    message: BANNED_JP_MESSAGE,
  });

const buildLocalizedStringSchema = (lang: LanguageCode, fieldLabel: string, maxLength: number) => {
  let schema = buildFieldSchema(`${fieldLabel} (${lang.toUpperCase()})`, maxLength);

  if (lang === "ja") {
    schema = withJapaneseBan(schema);
  }

  return schema;
};

const createLocalizedFieldSchema = (opts: { fieldLabel: string; maxLength: number }) =>
  z.object(
    Object.fromEntries(
      LANGUAGES.map((lang) => [lang, buildLocalizedStringSchema(lang, opts.fieldLabel, opts.maxLength)]),
    ) as Record<LanguageCode, z.ZodString>,
  );

export const localizedNameSchema = createLocalizedFieldSchema({
  fieldLabel: "Name",
  maxLength: MAX_NAME_LENGTH,
});

export const localizedTextSchema = createLocalizedFieldSchema({
  fieldLabel: "Field",
  maxLength: MAX_TEXT_LENGTH,
});

const productTextField = (fieldLabel: string, maxLength: number) =>
  buildFieldSchema(fieldLabel, maxLength);

export const productTextSchema = z
  .object({
    productId: z.string().uuid("productId must be a valid UUID"),
    language: z.enum(LANGUAGES),
    name: productTextField("Name", MAX_NAME_LENGTH),
    description: productTextField("Description", MAX_TEXT_LENGTH),
    effects: productTextField("Effects", MAX_TEXT_LENGTH),
    sideEffects: productTextField("Side Effects", MAX_TEXT_LENGTH),
    goodFor: productTextField("Good For", MAX_TEXT_LENGTH),
  })
  .superRefine((value, ctx) => {
    if (value.language !== "ja") {
      return;
    }
    (["name", "description", "effects", "sideEffects", "goodFor"] as const).forEach((field) => {
      if (BANNED_JP_PATTERN.test(value[field])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: BANNED_JP_MESSAGE,
          path: [field],
        });
      }
    });
  });

const TAG_REGEX = /\s{2,}/;

export const productSchema = z
  .object({
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
          .refine((tag) => !TAG_REGEX.test(tag), {
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
  })
  .passthrough();

export const bundlePayloadSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  builtAt: z.string().datetime(),
  products: z.array(productSchema),
  purchaseLog: z.array(z.unknown()),
});

export type ProductText = z.infer<typeof productTextSchema>;
export type Product = z.infer<typeof productSchema>;
export type BundlePayload = z.infer<typeof bundlePayloadSchema>;

export const emptyLocalizedField = (): Record<LanguageCode, string> =>
  LANGUAGES.reduce(
    (acc, lang) => {
      acc[lang] = "";
      return acc;
    },
    {} as Record<LanguageCode, string>,
  );

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

export const BANNED_JAPANESE_PATTERN = BANNED_JP_PATTERN;
