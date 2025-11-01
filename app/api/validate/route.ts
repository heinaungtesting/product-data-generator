import { NextRequest, NextResponse } from "next/server";
import { productSchema } from "@/schema";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const result = productSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json(
        {
          valid: false,
          issues: result.error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ valid: true, data: result.data });
  } catch (error) {
    console.error("/api/validate error", error);
    return NextResponse.json(
      { valid: false, error: "Invalid JSON payload" },
      { status: 400 },
    );
  }
}
