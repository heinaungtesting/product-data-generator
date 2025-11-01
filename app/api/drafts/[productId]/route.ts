import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DraftRouteContext = {
  params: Promise<{ productId?: string }>;
};

const resolveProductId = async (context: DraftRouteContext) => {
  const resolved = await context.params;
  const productId = resolved?.productId;
  if (typeof productId !== "string" || productId.length === 0) {
    throw new Error("Missing productId in route params.");
  }
  return productId;
};

export async function GET(_request: NextRequest, context: DraftRouteContext) {
  const productId = await resolveProductId(context);
  const draft = await prisma.draft.findUnique({ where: { productId } });
  if (!draft) {
    return NextResponse.json({ draft: null });
  }
  return NextResponse.json({ draft });
}

export async function PUT(request: NextRequest, context: DraftRouteContext) {
  const productId = await resolveProductId(context);

  try {
    const body = await request.json();
    const blob = body as Prisma.InputJsonValue;
    const now = new Date();

    await prisma.draft.upsert({
      where: { productId },
      create: { productId, blob, updatedAt: now },
      update: { blob, updatedAt: now },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`/api/drafts/${productId} PUT error`, error);
    return NextResponse.json({ success: false, error: "Unable to save draft." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: DraftRouteContext) {
  const productId = await resolveProductId(context);
  await prisma.draft.delete({ where: { productId } }).catch(() => undefined);
  return NextResponse.json({ success: true });
}
