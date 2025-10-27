import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGUAGES, MAX_NAME_LENGTH, MAX_TEXT_LENGTH, SCHEMA_VERSION } from "../src/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BANNED_PATTERN = "(?:治る|治癒|効く|がん|糖尿病|高血圧)";

const localizedFieldSchema = (maxLength: number, fieldLabel: string) => {
  const properties: Record<string, unknown> = {};
  LANGUAGES.forEach((lang) => {
    const schema: Record<string, unknown> = {
      type: "string",
      minLength: 1,
      maxLength,
      pattern: ".*\\S.*",
      description: `${fieldLabel} (${lang.toUpperCase()})`,
    };
    if (lang === "ja") {
      schema.not = { pattern: BANNED_PATTERN };
    }
    properties[lang] = schema;
  });
  return {
    type: "object",
    additionalProperties: false,
    required: [...LANGUAGES],
    properties,
  };
};

const tagSchema = {
  type: "string",
  minLength: 1,
  maxLength: 40,
  not: { pattern: "\\s{2,}" },
};

const productSchema = {
  type: "object",
  additionalProperties: true,
  required: [
    "id",
    "category",
    "pointValue",
    "tags",
    "name",
    "description",
    "effects",
    "sideEffects",
    "goodFor",
    "updatedAt",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    category: { type: "string", enum: ["health", "cosmetic"] },
    pointValue: {
      type: "integer",
      minimum: 0,
      maximum: 1_000_000,
    },
    tags: {
      type: "array",
      maxItems: 25,
      items: tagSchema,
    },
    name: localizedFieldSchema(MAX_NAME_LENGTH, "Name"),
    description: localizedFieldSchema(MAX_TEXT_LENGTH, "Description"),
    effects: localizedFieldSchema(MAX_TEXT_LENGTH, "Effects"),
    sideEffects: localizedFieldSchema(MAX_TEXT_LENGTH, "Side Effects"),
    goodFor: localizedFieldSchema(MAX_TEXT_LENGTH, "Good For"),
    updatedAt: { type: "string", format: "date-time" },
  },
};

const bundleSchema = {
  type: "object",
  required: ["schemaVersion", "builtAt", "products", "purchaseLog"],
  additionalProperties: false,
  properties: {
    schemaVersion: { const: SCHEMA_VERSION },
    builtAt: { type: "string", format: "date-time" },
    products: {
      type: "array",
      items: productSchema,
    },
    purchaseLog: {
      type: "array",
      items: {},
    },
  },
};

const artifact = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://pdg.local/schema/bundle.json",
  title: "BundlePayload",
  description: "Validated bundle payload exported by the PDG platform.",
  meta: {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
  },
  ...bundleSchema,
};

const outputPath = join(__dirname, "..", "schema.json");

await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(`Wrote schema artifact to ${outputPath}`);
