import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { productId: string } }) {
  const draft = await prisma.draft.findUnique({ where: { productId: params.productId } });
  if (!draft) {
    return NextResponse.json({ draft: null }, { status: 404 });
  }
  return NextResponse.json({ draft });
}

export async function PUT(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const body = await request.json();
    const blob = body as Prisma.JsonValue;
    await prisma.draft.upsert({
      where: { productId: params.productId },
      create: { productId: params.productId, blob, updatedAt: new Date() },
      update: { blob, updatedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`/api/drafts/${params.productId} PUT error`, error);
    return NextResponse.json({ success: false, error: "Unable to save draft." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { productId: string } }) {
  await prisma.draft.delete({ where: { productId: params.productId } }).catch(() => undefined);
  return NextResponse.json({ success: true });
}
