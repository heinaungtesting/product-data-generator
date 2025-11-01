import type { SupabaseAdminClient } from "./supabaseClient";
import { resolveImage, type ResolvedImage } from "./imageUtils";
import { sanitizeLocalized } from "./lawSafe";
import { LANGUAGES } from "@/schema";

const BUCKET_NAME = "pdg";
export const PRODUCTS_CURSOR = "products";

export type LocalizedGroup = Record<(typeof LANGUAGES)[number], string>;

export type NormalizedProduct = {
  externalId: string;
  localized: {
    name: LocalizedGroup;
    description: LocalizedGroup;
    effects: LocalizedGroup;
    sideEffects: LocalizedGroup;
    goodFor: LocalizedGroup;
  };
  tags: string[];
  images: Array<{ source: string; filename?: string }>;
  updatedAt: string;
};

export type PersistedImage = {
  url: string;
  hash: string;
};

export type PersistResult = {
  cursor: string;
  images: PersistedImage[];
};

const mapLocalizedToColumns = (prefix: string, localized: LocalizedGroup) => {
  return Object.fromEntries(
    LANGUAGES.map((lang) => [`${prefix}_${lang}`, localized[lang] ?? ""]),
  );
};

const normalizeLocalizedGroup = (value: Record<string, string | undefined>): LocalizedGroup => {
  const sanitized = sanitizeLocalized(value);
  const result = {} as LocalizedGroup;
  LANGUAGES.forEach((lang) => {
    result[lang] = sanitized[lang] ?? "";
  });
  return result;
};

export const buildLocalizedGroups = (input: {
  name: Record<string, string | undefined>;
  description?: Record<string, string | undefined>;
  effects?: Record<string, string | undefined>;
  sideEffects?: Record<string, string | undefined>;
  goodFor?: Record<string, string | undefined>;
}): NormalizedProduct["localized"] => ({
  name: normalizeLocalizedGroup(input.name),
  description: normalizeLocalizedGroup(input.description ?? {}),
  effects: normalizeLocalizedGroup(input.effects ?? {}),
  sideEffects: normalizeLocalizedGroup(input.sideEffects ?? {}),
  goodFor: normalizeLocalizedGroup(input.goodFor ?? {}),
});

const uploadResolvedImage = async (
  client: SupabaseAdminClient,
  productId: string,
  resolved: ResolvedImage,
  filename?: string,
): Promise<PersistedImage> => {
  const hash = resolved.hash;
  const storage = client.storage.from(BUCKET_NAME);
  const objectKey = `images/${hash.replace("sha256:", "")}.${resolved.extension}`;

  const { data: existingImage, error: selectError } = await client
    .from("images")
    .select("id, url, product_id")
    .eq("hash", hash)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  let publicUrl = existingImage?.url ?? "";

  if (!existingImage) {
    const upload = await storage.upload(objectKey, Buffer.from(resolved.buffer), {
      contentType: resolved.contentType,
      upsert: true,
    });
    if (upload.error) {
      throw new Error(upload.error.message);
    }
    const { data: publicData } = storage.getPublicUrl(objectKey);
    publicUrl = publicData.publicUrl;
  }

  const upsertResponse = await client
    .from("images")
    .upsert(
      {
        product_id: productId,
        url: publicUrl,
        filename: filename ?? resolved.filename,
        hash,
      },
      { onConflict: "hash" },
    )
    .select("url")
    .single();

  if (upsertResponse.error || !upsertResponse.data) {
    throw new Error(upsertResponse.error?.message ?? "Failed to upsert image record.");
  }

  return { url: upsertResponse.data.url, hash };
};

export const persistProductGraph = async (
  client: SupabaseAdminClient,
  product: NormalizedProduct,
): Promise<PersistResult> => {
  const productRow = {
    external_id: product.externalId,
    updated_at: product.updatedAt,
    ...mapLocalizedToColumns("name", product.localized.name),
    ...mapLocalizedToColumns("desc", product.localized.description),
    ...mapLocalizedToColumns("effects", product.localized.effects),
    ...mapLocalizedToColumns("side", product.localized.sideEffects),
    ...mapLocalizedToColumns("good", product.localized.goodFor),
  };

  const upsertProduct = await client
    .from("products")
    .upsert(productRow, { onConflict: "external_id", ignoreDuplicates: false })
    .select("id, updated_at")
    .single();

  if (upsertProduct.error || !upsertProduct.data) {
    throw new Error(upsertProduct.error?.message ?? "Failed to upsert product.");
  }

  const productId = upsertProduct.data.id as string;

  await client.from("product_tags").delete().eq("product_id", productId);

  if (product.tags.length > 0) {
    const tagRows = product.tags.map((tag) => ({
      product_id: productId,
      tag,
    }));
    const tagInsert = await client
      .from("product_tags")
      .upsert(tagRows, { onConflict: "product_id,tag" });
    if (tagInsert.error) {
      throw new Error(tagInsert.error.message);
    }
  }

  const images: PersistedImage[] = [];
  for (const image of product.images) {
    try {
      const resolved = await resolveImage(image.source, image.filename);
      const persisted = await uploadResolvedImage(client, productId, resolved, image.filename);
      images.push(persisted);
    } catch (error) {
      console.warn(`Failed to process image for product ${product.externalId}:`, error);
    }
  }

  return { cursor: upsertProduct.data.updated_at as string, images };
};

export const updateProductsCursor = async (client: SupabaseAdminClient, cursor: string) => {
  const upsertCursor = await client
    .from("cursors")
    .upsert(
      {
        name: PRODUCTS_CURSOR,
        value: cursor,
      },
      { onConflict: "name" },
    )
    .select("value")
    .single();

  if (upsertCursor.error) {
    throw new Error(upsertCursor.error.message);
  }
};

export type DeltaProduct = {
  externalId: string;
  updatedAt: string;
  localized: NormalizedProduct["localized"];
  tags: string[];
  images: PersistedImage[];
};

export type DeltaResponse = {
  items: DeltaProduct[];
  nextCursor: string | null;
};

const mapRowToLocalized = (row: Record<string, any>): NormalizedProduct["localized"] => {
  const mapSection = (prefix: string) => {
    const result = {} as LocalizedGroup;
    LANGUAGES.forEach((lang) => {
      result[lang] = row[`${prefix}_${lang}`] ?? "";
    });
    return result;
  };
  return {
    name: mapSection("name"),
    description: mapSection("desc"),
    effects: mapSection("effects"),
    sideEffects: mapSection("side"),
    goodFor: mapSection("good"),
  };
};

export const fetchProductsDelta = async (
  client: SupabaseAdminClient,
  since: string | null,
  limit: number,
): Promise<DeltaResponse> => {
  const query = client
    .from("products")
    .select(
      `
        id,
        external_id,
        updated_at,
        name_ja, name_en, name_zh, name_th, name_ko,
        desc_ja, desc_en, desc_zh, desc_th, desc_ko,
        effects_ja, effects_en, effects_zh, effects_th, effects_ko,
        side_ja, side_en, side_zh, side_th, side_ko,
        good_ja, good_en, good_zh, good_th, good_ko,
        product_tags(tag),
        images(url, hash)
      `,
      { count: "exact" },
    )
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (since) {
    query.gt("updated_at", since);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((row) => ({
    externalId: row.external_id as string,
    updatedAt: row.updated_at as string,
    localized: mapRowToLocalized(row),
    tags: (row.product_tags ?? []).map((entry: { tag: string }) => entry.tag),
    images: (row.images ?? []).map((entry: { url: string; hash: string }) => entry),
  }));

  const nextCursor = items.length > 0 ? items[items.length - 1].updatedAt : null;

  return { items, nextCursor };
};
