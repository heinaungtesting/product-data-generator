import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const fetchDeltaMock = vi.fn(async () => ({
  items: [
    {
      externalId: "ext-10",
      updatedAt: "2025-10-29T02:00:00Z",
      localized: {
        name: { ja: "やさしい保湿クリーム", en: "Gentle Cream", zh: "温和面霜", th: "ครีมอ่อนโยน", ko: "순한 크림" },
        description: { ja: "肌をすこやかに保つクリーム。", en: "Keeps skin healthy.", zh: "保持皮肤健康。", th: "ดูแลผิวให้สุขภาพดี", ko: "피부를 건강하게 유지" },
        effects: { ja: "うるおいを与える。", en: "Moisturizes", zh: "保湿", th: "มอบความชุ่มชื้น", ko: "보습" },
        sideEffects: { ja: "使用上の注意に従ってください。", en: "Follow instructions.", zh: "请遵循说明", th: "ทำตามคำแนะนำ", ko: "사용 지침을 따르세요" },
        goodFor: { ja: "日常ケア", en: "Daily care", zh: "日常护理", th: "ดูแลประจำวัน", ko: "일상 관리" },
      },
      tags: ["保湿", "肌ケア"],
      images: [{ url: "https://cdn/p1.jpg", hash: "sha256:hash" }],
    },
  ],
  nextCursor: "2025-10-29T02:00:00Z",
}));

vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/pdgRepository", () => ({
  fetchProductsDelta: fetchDeltaMock,
}));

const { GET } = await import("./route");

const buildRequest = (url: string) =>
  ({
    nextUrl: new URL(url) as any,
    headers: new Headers(),
  }) as unknown as NextRequest;

describe("/api/products delta", () => {
  it("returns products with cursor", async () => {
    const response = await GET(buildRequest("https://example.com/api/products?since=cursor-1&limit=1"));
    const payload = await response.json();

    expect(fetchDeltaMock).toHaveBeenCalledWith(expect.anything(), "cursor-1", 1);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].name.ja).toBe("やさしい保湿クリーム");
    expect(payload.items[0].images[0].hash).toBe("sha256:hash");
    expect(payload.nextCursor).toBe("2025-10-29T02:00:00Z");
  });
});
