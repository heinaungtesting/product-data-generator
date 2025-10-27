import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildBundle,
  listProducts,
  listTags,
  normalizeProductInput,
  saveProduct,
} from "@/lib/product-service";
import { ZodError } from "zod";

const parseFilters = (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? searchParams.get("q") ?? undefined;
  const categories = new Set<string>();
  const tags = new Set<string>();

  const collect = (param: string, set: Set<string>) => {
    const direct = searchParams.getAll(param);
    direct.forEach((value) => {
      if (value) {
        set.add(value);
      }
    });
    const combined = searchParams.get(`${param}s`);
    if (combined) {
      combined
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((value) => set.add(value));
    }
  };

  collect("category", categories);
  collect("tag", tags);

  return {
    search,
    categories: Array.from(categories),
    tags: Array.from(tags),
  };
};

export async function GET(request: NextRequest) {
  const { search, categories, tags } = parseFilters(request);
  const products = await listProducts({ search: search ?? undefined, categories, tags });
  const availableTags = await listTags();
  return NextResponse.json({ products, availableTags });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const product = normalizeProductInput(payload);

    await prisma.$transaction(async (tx) => {
      await saveProduct(product, tx);
      await tx.draft.delete({ where: { productId: product.id } }).catch(() => undefined);
    });

    await buildBundle();

    return NextResponse.json({ success: true, product });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, issues: error.issues }, { status: 400 });
    }
    console.error("/api/products POST error", error);
    return NextResponse.json({ success: false, error: "Unable to save product." }, { status: 500 });
  }
}
