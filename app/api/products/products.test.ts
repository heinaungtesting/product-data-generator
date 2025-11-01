import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const listProductsMock = vi.fn(async () => [
  {
    id: "test-id-1",
    category: "health" as const,
    pointValue: 100,
    name: { ja: "やさしい保湿クリーム", en: "Gentle Cream", zh: "温和面霜", th: "ครีมอ่อนโยน", ko: "순한 크림" },
    description: { ja: "肌をすこやかに保つクリーム。", en: "Keeps skin healthy.", zh: "保持皮肤健康。", th: "ดูแลผิวให้สุขภาพดี", ko: "피부를 건강하게 유지" },
    effects: { ja: "うるおいを与える。", en: "Moisturizes", zh: "保湿", th: "มอบความชุ่มชื้น", ko: "보습" },
    sideEffects: { ja: "使用上の注意に従ってください。", en: "Follow instructions.", zh: "请遵循说明", th: "ทำตามคำแนะนำ", ko: "사용 지침을 따르세요" },
    goodFor: { ja: "日常ケア", en: "Daily care", zh: "日常护理", th: "ดูแลประจำวัน", ko: "일상 관리" },
    tags: ["保湿", "肌ケア"],
    updatedAt: "2025-10-29T02:00:00Z",
  },
]);

const listTagsMock = vi.fn(async () => ["保湿", "肌ケア"]);

vi.mock("@/lib/product-service", () => ({
  listProducts: listProductsMock,
  listTags: listTagsMock,
}));

const { GET } = await import("./route");

const buildRequest = (url: string) =>
  ({
    nextUrl: new URL(url) as any,
    headers: new Headers(),
  }) as unknown as NextRequest;

describe("/api/products", () => {
  it("returns products and tags", async () => {
    const response = await GET(buildRequest("https://example.com/api/products"));
    const payload = await response.json();

    expect(listProductsMock).toHaveBeenCalled();
    expect(listTagsMock).toHaveBeenCalled();
    expect(payload.products).toHaveLength(1);
    expect(payload.products[0].name.ja).toBe("やさしい保湿クリーム");
    expect(payload.availableTags).toEqual(["保湿", "肌ケア"]);
  });
});
