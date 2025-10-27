import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBundle, normalizeProductInput, saveProduct } from "@/lib/product-service";
import { ZodError } from "zod";

type ImportError = {
  line: number;
  message: string;
};

const readLines = (payload: string) =>
  payload
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const lines = readLines(text);

    if (lines.length === 0) {
      return NextResponse.json({ success: false, error: "No data provided." }, { status: 400 });
    }

    const products = [];
    const errors: ImportError[] = [];

    lines.forEach((line, index) => {
      try {
        const parsed = JSON.parse(line);
        const product = normalizeProductInput(parsed);
        products.push(product);
      } catch (error) {
        if (error instanceof ZodError) {
          const message = error.issues
            .map((issue) => {
              const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
              return `${path}: ${issue.message}`;
            })
            .join("; ");
          errors.push({ line: index + 1, message });
        } else if (error instanceof Error) {
          errors.push({ line: index + 1, message: error.message });
        } else {
          errors.push({ line: index + 1, message: "Unknown error" });
        }
      }
    });

    if (products.length === 0) {
      return NextResponse.json({ success: false, imported: 0, errors }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const product of products) {
        await saveProduct(product, tx);
        await tx.draft.delete({ where: { productId: product.id } }).catch(() => undefined);
      }
    });

    await buildBundle();

    return NextResponse.json({
      success: true,
      imported: products.length,
      skipped: errors.length,
      errors,
    });
  } catch (error) {
    console.error("/api/import POST error", error);
    return NextResponse.json({ success: false, error: "Failed to import data." }, { status: 500 });
  }
}
