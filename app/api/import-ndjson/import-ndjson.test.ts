import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const saveProductMock = vi.fn(async () => "test-id");
const buildBundleMock = vi.fn(async () => ({ etag: "test", sizeBytes: 100, path: "/bundle/latest.json.gz" }));

vi.mock("@/lib/product-service", () => ({
  saveProduct: saveProductMock,
  normalizeProductInput: vi.fn((input) => input),
  buildBundle: buildBundleMock,
}));

const { POST } = await import("./route");

const buildRequest = (body: string, contentType = "application/x-ndjson") =>
  ({
    headers: new Headers({ "content-type": contentType }),
    text: async () => body,
  }) as unknown as NextRequest;

describe("/api/import-ndjson", () => {
  beforeEach(() => {
    saveProductMock.mockClear();
    buildBundleMock.mockClear();
  });

  it("imports NDJSON products", async () => {
    const line = JSON.stringify({
      externalId: "ext-1",
      name: { ja: "保湿クリーム", en: "Moisturizing Cream" },
      description: { ja: "肌をすこやかに保つクリーム。" },
      effects: { ja: "うるおいを与える" },
      sideEffects: { ja: "使用上の注意に従ってください。" },
      goodFor: { ja: "日常ケア" },
      tags: ["保湿"],
    });

    const response = await POST(buildRequest(`${line}`));
    const payload = await response.json();

    expect(payload.imported).toBe(1);
    expect(payload.skipped).toBe(0);
    expect(saveProductMock).toHaveBeenCalledTimes(1);
    expect(buildBundleMock).toHaveBeenCalledTimes(1);
  });

  it("collects errors for invalid lines", async () => {
    const invalidLine = "{ invalid json";
    const response = await POST(buildRequest(invalidLine));
    const payload = await response.json();
    expect(payload.imported).toBe(0);
    expect(payload.skipped).toBe(1);
    expect(payload.errors[0].line).toBe(1);
  });
});
