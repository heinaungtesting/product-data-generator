import { NextRequest, NextResponse } from "next/server";
import { buildBundle, listProducts, listTags, saveProduct } from "@/lib/product-service";
import { normalizeProductInput } from "@/lib/product-service";
import { deleteDraft } from "@/lib/product-service";
import { productSchema } from "@pdg/schema";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    const categories = request.nextUrl.searchParams.getAll("category");
    const tags = request.nextUrl.searchParams.getAll("tag");

    const products = await listProducts({ search, categories, tags });
    const availableTags = await listTags();

    return NextResponse.json({ products, availableTags });
  } catch (error) {
    console.error("/api/products GET error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = normalizeProductInput(body);
    const parsed = productSchema.safeParse(product);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await saveProduct(parsed.data);
    await deleteDraft(parsed.data.id);
    await buildBundle();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/products POST error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
