import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type {
  Draft,
  Prisma,
  Product as PrismaProduct,
  ProductCategory,
  ProductText,
  ProductTag,
  Tag,
} from "@prisma/client";
import { prisma } from "./prisma";
import {
  bundlePayloadSchema,
  createEmptyProduct,
  emptyLocalizedField,
  LANGUAGES,
  productSchema,
  SCHEMA_VERSION,
  type BundlePayload,
  type LanguageCode,
  type Product,
} from "@pdg/schema";

const LOCALIZABLE_FIELDS = ["name", "description", "effects", "sideEffects", "goodFor"] as const;
const HAS_ZH_LANGUAGE = LANGUAGES.includes("zh" as LanguageCode);
const MAX_PRODUCTS = 100; // Limit for local storage optimization

const normalizeTags = (input: string[]): string[] => {
  const normalized = new Set<string>();
  input.forEach((tag) => {
    const trimmed = tag.trim();
    if (trimmed.length > 0) {
      normalized.add(trimmed);
    }
  });
  return Array.from(normalized);
};

const fillPlaceholders = (product: Product): Product => {
  LOCALIZABLE_FIELDS.forEach((field) => {
    const fieldValue = product[field];
    let preferred = "";
    for (const lang of LANGUAGES) {
      const candidate = fieldValue[lang]?.trim();
      if (candidate) {
        preferred = candidate;
        break;
      }
    }
    LANGUAGES.forEach((lang) => {
      if (!fieldValue[lang] || fieldValue[lang].trim().length === 0) {
        fieldValue[lang] = preferred;
      }
    });
  });
  return product;
};

export const normalizeProductInput = (raw: unknown): Product => {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Product payload must be an object");
  }

  const base = createEmptyProduct();
  const source = raw as Record<string, unknown>;

  if (typeof source.id === "string") {
    base.id = source.id;
  }

  if (typeof source.category === "string" && (source.category === "health" || source.category === "cosmetic")) {
    base.category = source.category;
  }

  if (typeof source.pointValue === "number") {
    base.pointValue = Number.isFinite(source.pointValue) ? Math.trunc(source.pointValue) : base.pointValue;
  } else if (typeof source.pointValue === "string") {
    const parsed = Number.parseInt(source.pointValue, 10);
    if (Number.isFinite(parsed)) {
      base.pointValue = parsed;
    }
  }

  if (Array.isArray(source.tags)) {
    base.tags = normalizeTags(source.tags.filter((value): value is string => typeof value === "string"));
  }

  LOCALIZABLE_FIELDS.forEach((field) => {
    const value = source[field];
    const localized = emptyLocalizedField();

    if (typeof value === "string") {
      localized.ja = value;
    } else if (value && typeof value === "object") {
      const entries = value as Record<string, unknown>;
      LANGUAGES.forEach((lang) => {
        const candidate = entries[lang];
        if (typeof candidate === "string") {
          localized[lang] = candidate;
        }
      });
      // Fallback for legacy payloads when Chinese was stored outside the LANGUAGES tuple
      if (!HAS_ZH_LANGUAGE) {
        const zhValue = entries["zh"];
        if (typeof zhValue === "string" && localized.ja.trim().length === 0) {
          localized.ja = zhValue;
        }
      }
    }

    base[field] = localized;
  });

  if (typeof source.updatedAt === "string") {
    const date = new Date(source.updatedAt);
    if (!Number.isNaN(date.getTime())) {
      base.updatedAt = date.toISOString();
    }
  }

  const parsed = productSchema.parse(fillPlaceholders(base));
  return {
    ...parsed,
    tags: normalizeTags(parsed.tags),
  };
};

type ProductRecord = PrismaProduct & {
  texts: ProductText[];
  tags: Array<ProductTag & { tag: Tag }>;
};

const mapProductRecord = (record: ProductRecord): Product => {
  const localized = LOCALIZABLE_FIELDS.reduce<Record<(typeof LOCALIZABLE_FIELDS)[number], Record<LanguageCode, string>>>(
    (acc, field) => {
      acc[field] = emptyLocalizedField();
      return acc;
    },
    {} as Record<(typeof LOCALIZABLE_FIELDS)[number], Record<LanguageCode, string>>,
  );

  record.texts.forEach((text) => {
    const lang = text.language as LanguageCode;
    localized.name[lang] = text.name;
    localized.description[lang] = text.description;
    localized.effects[lang] = text.effects;
    localized.sideEffects[lang] = text.sideEffects;
    localized.goodFor[lang] = text.goodFor;
  });

  const tags = record.tags.map((entry) => entry.tag.name);

  return productSchema.parse(
    fillPlaceholders({
      id: record.id,
      category: record.category,
      pointValue: record.pointValue,
      tags,
      name: localized.name,
      description: localized.description,
      effects: localized.effects,
      sideEffects: localized.sideEffects,
      goodFor: localized.goodFor,
      updatedAt: record.contentUpdatedAt.toISOString(),
    }),
  );
};

const upsertTags = async (tx: Prisma.TransactionClient, productId: string, tags: string[]) => {
  await tx.productTag.deleteMany({ where: { productId } });
  if (tags.length === 0) {
    return;
  }
  const tagRecords = await Promise.all(
    tags.map((tag) =>
      tx.tag.upsert({
        where: { name: tag },
        create: { name: tag },
        update: {},
      }),
    ),
  );

  await tx.productTag.createMany({
    data: tagRecords.map((tag) => ({ productId, tagId: tag.id })),
  });
};

const upsertTexts = async (tx: Prisma.TransactionClient, product: Product) => {
  await Promise.all(
    LANGUAGES.map((lang) =>
      tx.productText.upsert({
        where: {
          productId_language: {
            productId: product.id,
            language: lang,
          },
        },
        create: {
          productId: product.id,
          language: lang,
          name: product.name[lang],
          description: product.description[lang],
          effects: product.effects[lang],
          sideEffects: product.sideEffects[lang],
          goodFor: product.goodFor[lang],
        },
        update: {
          name: product.name[lang],
          description: product.description[lang],
          effects: product.effects[lang],
          sideEffects: product.sideEffects[lang],
          goodFor: product.goodFor[lang],
        },
      }),
    ),
  );
};

export const saveProduct = async (input: Product, tx?: Prisma.TransactionClient) => {
  const parsed = productSchema.parse(
    fillPlaceholders({
      ...input,
      tags: normalizeTags(input.tags),
    }),
  );
  const executor = tx ?? prisma;

  // Check if this is a new product
  const existing = await executor.product.findUnique({ where: { id: parsed.id } });

  // If it's a new product, check the count limit
  if (!existing) {
    const count = await executor.product.count();
    if (count >= MAX_PRODUCTS) {
      throw new Error(`Cannot add more than ${MAX_PRODUCTS} products. Please delete some products first to optimize local storage.`);
    }
  }

  const product = await executor.product.upsert({
    where: { id: parsed.id },
    create: {
      id: parsed.id,
      category: parsed.category,
      pointValue: parsed.pointValue,
      contentUpdatedAt: new Date(parsed.updatedAt),
    },
    update: {
      category: parsed.category,
      pointValue: parsed.pointValue,
      contentUpdatedAt: new Date(parsed.updatedAt),
    },
  });

  await upsertTexts(executor, parsed);
  await upsertTags(executor, product.id, parsed.tags);

  return product.id;
};

export const removeProduct = async (id: string) => {
  await prisma.product.delete({ where: { id } });
};

export const listProducts = async (
  options: {
    search?: string;
    categories?: string[];
    tags?: string[];
  } = {},
) => {
  const { search, categories, tags } = options;

  const where: Prisma.ProductWhereInput = {};

  if (search && search.trim().length > 0) {
    where.texts = {
      some: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { effects: { contains: search, mode: "insensitive" } },
          { sideEffects: { contains: search, mode: "insensitive" } },
          { goodFor: { contains: search, mode: "insensitive" } },
        ],
      },
    };
  }

  const categoryFilters = (categories ?? []).filter(
    (category): category is ProductCategory => category === "health" || category === "cosmetic",
  );
  if (categoryFilters.length > 0) {
    where.category = { in: categoryFilters };
  }

  if (tags && tags.length > 0) {
    where.tags = {
      some: {
        tag: {
          name: {
            in: tags,
          },
        },
      },
    };
  }

  const records = await prisma.product.findMany({
    where,
    include: {
      texts: true,
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return records.map(mapProductRecord);
};

const BUNDLE_PATH = "/bundle/latest.json.gz";

const writeBundleArtifact = async (payload: BundlePayload) => {
  const json = JSON.stringify(payload);
  const compressed = gzipSync(Buffer.from(json, "utf8"));
  const etag = createHash("sha256").update(compressed).digest("hex");
  const bundleDir = join(process.cwd(), "public", "bundle");
  await mkdir(bundleDir, { recursive: true });
  const filePath = join(bundleDir, "latest.json.gz");
  await writeFile(filePath, compressed);

  await prisma.bundle.upsert({
    where: { path: BUNDLE_PATH },
    create: {
      path: BUNDLE_PATH,
      etag,
      schemaVersion: payload.schemaVersion,
      builtAt: new Date(payload.builtAt),
      sizeBytes: compressed.length,
    },
    update: {
      etag,
      schemaVersion: payload.schemaVersion,
      builtAt: new Date(payload.builtAt),
      sizeBytes: compressed.length,
    },
  });

  return { etag, sizeBytes: compressed.length, path: BUNDLE_PATH };
};

export const buildBundle = async () => {
  const products = await listProducts();
  const payload = bundlePayloadSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    builtAt: new Date().toISOString(),
    products,
    purchaseLog: [],
  });
  return writeBundleArtifact(payload);
};

export const getLatestBundle = async () => {
  const bundle = await prisma.bundle.findFirst({
    where: { path: BUNDLE_PATH },
    orderBy: { builtAt: "desc" },
  });
  return bundle;
};

export const loadDraft = async (productId: string): Promise<Draft | null> => {
  return prisma.draft.findUnique({ where: { productId } });
};

export const saveDraft = async (productId: string, blob: unknown) => {
  await prisma.draft.upsert({
    where: { productId },
    create: { productId, blob: blob as Prisma.JsonValue, updatedAt: new Date() },
    update: { blob: blob as Prisma.JsonValue, updatedAt: new Date() },
  });
};

export const deleteDraft = async (productId: string) => {
  await prisma.draft.delete({ where: { productId } }).catch(() => undefined);
};

export const listTags = async () => {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return tags.map((tag) => tag.name);
};

export const getProductCount = async () => {
  return prisma.product.count();
};

export const getMaxProducts = () => MAX_PRODUCTS;
