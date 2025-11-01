import { NextResponse } from "next/server";
import { listProducts } from "@/lib/product-service";

export async function GET() {
  try {
    const products = await listProducts();

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      productCount: products.length,
      products,
    };

    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="product-data-export-${new Date().toISOString().split("T")[0]}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("/api/export GET error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
