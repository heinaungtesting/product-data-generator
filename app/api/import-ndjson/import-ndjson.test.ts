import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { NextRequest } from "next/server";

const persistMock = vi.fn(async () => ({ cursor: "2025-10-29T02:00:00Z", images: [] }));
const updateCursorMock = vi.fn(async () => {});

vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/pdgRepository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pdgRepository")>("@/lib/pdgRepository");
  return {
    ...actual,
    persistProductGraph: persistMock,
    updateProductsCursor: updateCursorMock,
  };
});

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({ ok: true, text: async () => "" })) as unknown as typeof fetch,
);

const { POST } = await import("./route");

const buildRequest = (body: string, contentType = "application/x-ndjson") =>
  ({
    headers: new Headers({ "content-type": contentType }),
    text: async () => body,
  }) as unknown as NextRequest;

describe("/api/import-ndjson", () => {
  beforeEach(() => {
    persistMock.mockClear();
    updateCursorMock.mockClear();
    (fetch as unknown as Mock).mockClear();
    process.env.PDG_WEBHOOK_URL = "https://example.com/webhook";
    process.env.PDG_WEBHOOK_HMAC = "super-secret";
  });

  afterEach(() => {
    delete process.env.PDG_WEBHOOK_URL;
    delete process.env.PDG_WEBHOOK_HMAC;
  });

  it("imports and sanitizes NDJSON products", async () => {
    const line = JSON.stringify({
      externalId: "ext-1",
      name: { ja: "治るクリーム", en: "Healing Cream" },
      description: { ja: "肌をすこやかに保つクリーム。" },
      effects: { ja: "効くし予防もできる" },
      sideEffects: { ja: "使用上の注意に従ってください。" },
      goodFor: { ja: "日常ケア" },
      tags: ["保湿", "保湿"],
      images: [{ url: "data:image/png;base64,ZmFrZQ==", filename: "cream.png" }],
    });

    const response = await POST(buildRequest(`${line}`));
    const payload = await response.json();

    expect(payload.imported).toBe(1);
    expect(payload.skipped).toBe(0);
    expect(persistMock).toHaveBeenCalledTimes(1);
    const normalized = persistMock.mock.calls[0][1];
    expect(normalized.externalId).toBe("ext-1");
    expect(normalized.localized.name.ja).not.toMatch(/治る/);
    expect(normalized.tags).toEqual(["保湿"]);
    expect(updateCursorMock).toHaveBeenCalledWith(expect.anything(), "2025-10-29T02:00:00Z");
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({ method: "POST" }),
    );
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
