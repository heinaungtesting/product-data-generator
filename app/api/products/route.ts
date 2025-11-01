import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseClient";
import { fetchProductsDelta } from "@/lib/pdgRepository";

const MAX_LIMIT = 200;

const parseLimit = (value: string | null): number => {
  if (!value) return MAX_LIMIT;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return MAX_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
};

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since");
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const client = getSupabaseAdminClient();
    const { items, nextCursor } = await fetchProductsDelta(client, since, limit);

    const responseItems = items.map((item) => ({
      externalId: item.externalId,
      name: item.localized.name,
      description: item.localized.description,
      effects: item.localized.effects,
      sideEffects: item.localized.sideEffects,
      goodFor: item.localized.goodFor,
      tags: item.tags,
      images: item.images,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({ items: responseItems, nextCursor });
  } catch (error) {
    console.error("/api/products GET error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
