import { NextRequest, NextResponse } from "next/server";
import { getLatestBundle } from "@/lib/product-service";

const BUNDLE_PATH = "/bundle/latest.json.gz";

export async function GET(request: NextRequest) {
  const bundle = await getLatestBundle();
  const url = new URL(BUNDLE_PATH, request.url);
  const response = NextResponse.redirect(url.toString(), { status: 302 });
  if (bundle?.etag) {
    response.headers.set("ETag", bundle.etag);
  }
  if (bundle?.sizeBytes) {
    response.headers.set("Content-Length", bundle.sizeBytes.toString());
  }
  return response;
}
