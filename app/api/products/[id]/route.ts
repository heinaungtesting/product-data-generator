import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildBundle } from "@/lib/product-service";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing product id." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
      await tx.draft.delete({ where: { productId: id } }).catch(() => undefined);
    });

    await buildBundle();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }
    console.error(`/api/products/${params.id} DELETE error`, error);
    return NextResponse.json({ success: false, error: "Failed to delete product." }, { status: 500 });
  }
}
