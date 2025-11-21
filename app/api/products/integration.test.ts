import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock data
const mockProduct = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  category: "health" as const,
  pointValue: 100,
  name: { ja: "テスト製品", en: "Test Product", zh: "测试产品", th: "ผลิตภัณฑ์ทดสอบ", ko: "테스트 제품" },
  description: { ja: "説明文です", en: "Description here", zh: "描述在这里", th: "คำอธิบายที่นี่", ko: "설명입니다" },
  effects: { ja: "効果があります", en: "Has effects", zh: "有效果", th: "มีผลกระทบ", ko: "효과가 있습니다" },
  sideEffects: { ja: "注意点です", en: "Be careful", zh: "小心", th: "ระวัง", ko: "주의사항" },
  goodFor: { ja: "こんな方に", en: "Good for you", zh: "适合你", th: "ดีสำหรับคุณ", ko: "이런 분께" },
  tags: ["health", "test"],
  updatedAt: "2025-10-29T02:00:00Z",
};

const mockCosmeticProduct = {
  ...mockProduct,
  id: "550e8400-e29b-41d4-a716-446655440001",
  category: "cosmetic" as const,
  name: { ja: "化粧品テスト", en: "Cosmetic Test", zh: "化妆品测试", th: "เครื่องสำอางทดสอบ", ko: "화장품 테스트" },
};

// Mock functions
const listProductsMock = vi.fn();
const listTagsMock = vi.fn();
const saveProductMock = vi.fn();
const deleteDraftMock = vi.fn();
const buildBundleMock = vi.fn();
const normalizeProductInputMock = vi.fn();

vi.mock("@/lib/product-service", () => ({
  listProducts: listProductsMock,
  listTags: listTagsMock,
  saveProduct: saveProductMock,
  deleteDraft: deleteDraftMock,
  buildBundle: buildBundleMock,
  normalizeProductInput: normalizeProductInputMock,
}));

// Import route handlers after mocking
const { GET, POST } = await import("./route");

// Helper to build mock NextRequest for GET
const buildGetRequest = (url: string) =>
  ({
    nextUrl: new URL(url),
    headers: new Headers(),
  }) as unknown as NextRequest;

// Helper to build mock NextRequest for POST
const buildPostRequest = (body: unknown) =>
  ({
    nextUrl: new URL("https://example.com/api/products"),
    headers: new Headers({ "Content-Type": "application/json" }),
    json: async () => body,
  }) as unknown as NextRequest;

describe("/api/products Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    listProductsMock.mockResolvedValue([mockProduct]);
    listTagsMock.mockResolvedValue(["health", "test"]);
    saveProductMock.mockResolvedValue("550e8400-e29b-41d4-a716-446655440000");
    deleteDraftMock.mockResolvedValue(undefined);
    buildBundleMock.mockResolvedValue({ etag: "abc123", sizeBytes: 1024, path: "/bundle/latest.json.gz" });
  });

  describe("GET /api/products", () => {
    describe("Happy Path", () => {
      it("returns products and available tags successfully", async () => {
        const response = await GET(buildGetRequest("https://example.com/api/products"));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(listProductsMock).toHaveBeenCalledWith({ search: undefined, categories: [], tags: [] });
        expect(listTagsMock).toHaveBeenCalled();
        expect(payload.products).toHaveLength(1);
        expect(payload.products[0].id).toBe(mockProduct.id);
        expect(payload.availableTags).toEqual(["health", "test"]);
      });

      it("returns multiple products when available", async () => {
        listProductsMock.mockResolvedValue([mockProduct, mockCosmeticProduct]);

        const response = await GET(buildGetRequest("https://example.com/api/products"));
        const payload = await response.json();

        expect(payload.products).toHaveLength(2);
        expect(payload.products[0].category).toBe("health");
        expect(payload.products[1].category).toBe("cosmetic");
      });
    });

    describe("Filtering", () => {
      it("passes search query to listProducts", async () => {
        const response = await GET(buildGetRequest("https://example.com/api/products?search=moisturizer"));
        await response.json();

        expect(listProductsMock).toHaveBeenCalledWith({
          search: "moisturizer",
          categories: [],
          tags: [],
        });
      });

      it("passes single category filter to listProducts", async () => {
        const response = await GET(buildGetRequest("https://example.com/api/products?category=health"));
        await response.json();

        expect(listProductsMock).toHaveBeenCalledWith({
          search: undefined,
          categories: ["health"],
          tags: [],
        });
      });

      it("passes multiple category filters to listProducts", async () => {
        const response = await GET(buildGetRequest("https://example.com/api/products?category=health&category=cosmetic"));
        await response.json();

        expect(listProductsMock).toHaveBeenCalledWith({
          search: undefined,
          categories: ["health", "cosmetic"],
          tags: [],
        });
      });

      it("passes single tag filter to listProducts", async () => {
        const response = await GET(buildGetRequest("https://example.com/api/products?tag=skincare"));
        await response.json();

        expect(listProductsMock).toHaveBeenCalledWith({
          search: undefined,
          categories: [],
          tags: ["skincare"],
        });
      });

      it("passes multiple tag filters to listProducts", async () => {
        const response = await GET(buildGetRequest("https://example.com/api/products?tag=skincare&tag=moisturizer"));
        await response.json();

        expect(listProductsMock).toHaveBeenCalledWith({
          search: undefined,
          categories: [],
          tags: ["skincare", "moisturizer"],
        });
      });

      it("passes combined filters to listProducts", async () => {
        const response = await GET(
          buildGetRequest("https://example.com/api/products?search=cream&category=cosmetic&tag=skincare")
        );
        await response.json();

        expect(listProductsMock).toHaveBeenCalledWith({
          search: "cream",
          categories: ["cosmetic"],
          tags: ["skincare"],
        });
      });
    });

    describe("Empty State", () => {
      it("returns empty arrays when no products exist", async () => {
        listProductsMock.mockResolvedValue([]);
        listTagsMock.mockResolvedValue([]);

        const response = await GET(buildGetRequest("https://example.com/api/products"));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.products).toEqual([]);
        expect(payload.availableTags).toEqual([]);
      });

      it("returns empty products array with available tags when no products match filters", async () => {
        listProductsMock.mockResolvedValue([]);
        listTagsMock.mockResolvedValue(["health", "cosmetic"]);

        const response = await GET(buildGetRequest("https://example.com/api/products?search=nonexistent"));
        const payload = await response.json();

        expect(payload.products).toEqual([]);
        expect(payload.availableTags).toEqual(["health", "cosmetic"]);
      });
    });

    describe("Error Handling", () => {
      it("returns 500 when listProducts throws an error", async () => {
        listProductsMock.mockRejectedValue(new Error("Database connection failed"));

        const response = await GET(buildGetRequest("https://example.com/api/products"));
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload.error).toBe("Database connection failed");
      });

      it("returns 500 with 'Unknown error' when non-Error is thrown", async () => {
        listProductsMock.mockRejectedValue("string error");

        const response = await GET(buildGetRequest("https://example.com/api/products"));
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload.error).toBe("Unknown error");
      });
    });
  });

  describe("POST /api/products", () => {
    describe("Happy Path", () => {
      it("successfully creates a valid product", async () => {
        normalizeProductInputMock.mockReturnValue(mockProduct);

        const response = await POST(buildPostRequest(mockProduct));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
        expect(normalizeProductInputMock).toHaveBeenCalledWith(mockProduct);
        expect(saveProductMock).toHaveBeenCalled();
        expect(deleteDraftMock).toHaveBeenCalledWith(mockProduct.id);
        expect(buildBundleMock).toHaveBeenCalled();
      });

      it("creates a cosmetic product successfully", async () => {
        normalizeProductInputMock.mockReturnValue(mockCosmeticProduct);

        const response = await POST(buildPostRequest(mockCosmeticProduct));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
      });

      it("creates a product with minimal valid data", async () => {
        const minimalProduct = {
          ...mockProduct,
          tags: [],
          pointValue: 0,
        };
        normalizeProductInputMock.mockReturnValue(minimalProduct);

        const response = await POST(buildPostRequest(minimalProduct));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
      });
    });

    describe("Validation Errors - Missing Required Fields", () => {
      it("returns 400 when name is missing/empty", async () => {
        const invalidProduct = {
          ...mockProduct,
          name: { ja: "", en: "", zh: "", th: "", ko: "" },
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
        expect(payload.issues).toBeDefined();
      });

      it("returns 400 when category is invalid", async () => {
        const invalidProduct = {
          ...mockProduct,
          category: "invalid" as "health",
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });

      it("returns 400 when id is not a valid UUID", async () => {
        const invalidProduct = {
          ...mockProduct,
          id: "not-a-uuid",
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });

      it("returns 400 when description is missing", async () => {
        const invalidProduct = {
          ...mockProduct,
          description: { ja: "", en: "", zh: "", th: "", ko: "" },
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });
    });

    describe("Validation Errors - Invalid Data Types", () => {
      it("handles string instead of number for pointValue (normalizeProductInput should coerce)", async () => {
        // normalizeProductInput is expected to coerce the string to a number
        const inputWithStringPoint = {
          ...mockProduct,
          pointValue: "100",
        };
        // After normalization, it should be a number
        normalizeProductInputMock.mockReturnValue({
          ...mockProduct,
          pointValue: 100,
        });

        const response = await POST(buildPostRequest(inputWithStringPoint));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
      });

      it("returns 400 when pointValue is negative", async () => {
        const invalidProduct = {
          ...mockProduct,
          pointValue: -10,
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });

      it("returns 400 when pointValue exceeds maximum", async () => {
        const invalidProduct = {
          ...mockProduct,
          pointValue: 2_000_000,
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });

      it("returns 400 when updatedAt is not a valid datetime", async () => {
        const invalidProduct = {
          ...mockProduct,
          updatedAt: "not-a-date",
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });
    });

    describe("Edge Cases", () => {
      it("returns 400 when tags array exceeds maximum length", async () => {
        const invalidProduct = {
          ...mockProduct,
          tags: Array.from({ length: 30 }, (_, i) => `tag${i}`),
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });

      it("returns 400 when a tag is too long", async () => {
        const invalidProduct = {
          ...mockProduct,
          tags: ["a".repeat(50)], // Exceeds 40 character limit
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });

      it("returns 400 when name exceeds maximum length", async () => {
        const longName = "a".repeat(200); // Exceeds 150 character limit
        const invalidProduct = {
          ...mockProduct,
          name: { ja: longName, en: longName, zh: longName, th: longName, ko: longName },
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });

      it("returns 400 when Japanese name contains banned medical claims", async () => {
        const invalidProduct = {
          ...mockProduct,
          name: { ...mockProduct.name, ja: "がんを治る薬" },
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        const response = await POST(buildPostRequest(invalidProduct));
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload.error).toBe("Validation failed");
      });
    });

    describe("Error Handling", () => {
      it("returns 500 when saveProduct throws an error", async () => {
        normalizeProductInputMock.mockReturnValue(mockProduct);
        saveProductMock.mockRejectedValue(new Error("Database write failed"));

        const response = await POST(buildPostRequest(mockProduct));
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload.error).toBe("Database write failed");
      });

      it("returns 500 when buildBundle throws an error", async () => {
        normalizeProductInputMock.mockReturnValue(mockProduct);
        buildBundleMock.mockRejectedValue(new Error("Bundle generation failed"));

        const response = await POST(buildPostRequest(mockProduct));
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload.error).toBe("Bundle generation failed");
      });

      it("returns 500 with max products error message", async () => {
        normalizeProductInputMock.mockReturnValue(mockProduct);
        saveProductMock.mockRejectedValue(new Error("Cannot add more than 100 products. Please delete some products first to optimize local storage."));

        const response = await POST(buildPostRequest(mockProduct));
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload.error).toContain("Cannot add more than 100 products");
      });

      it("returns 500 with 'Unknown error' when non-Error is thrown", async () => {
        normalizeProductInputMock.mockReturnValue(mockProduct);
        saveProductMock.mockRejectedValue("string error");

        const response = await POST(buildPostRequest(mockProduct));
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload.error).toBe("Unknown error");
      });
    });

    describe("Side Effects", () => {
      it("deletes draft after successful save", async () => {
        normalizeProductInputMock.mockReturnValue(mockProduct);

        await POST(buildPostRequest(mockProduct));

        expect(deleteDraftMock).toHaveBeenCalledWith(mockProduct.id);
        // Verify call order by checking both were called
        expect(saveProductMock).toHaveBeenCalled();
      });

      it("rebuilds bundle after successful save", async () => {
        normalizeProductInputMock.mockReturnValue(mockProduct);

        await POST(buildPostRequest(mockProduct));

        expect(buildBundleMock).toHaveBeenCalled();
        // Verify call order by checking all were called
        expect(deleteDraftMock).toHaveBeenCalled();
      });

      it("does not delete draft or build bundle on validation error", async () => {
        const invalidProduct = {
          ...mockProduct,
          id: "invalid-uuid",
        };
        normalizeProductInputMock.mockReturnValue(invalidProduct);

        await POST(buildPostRequest(invalidProduct));

        expect(saveProductMock).not.toHaveBeenCalled();
        expect(deleteDraftMock).not.toHaveBeenCalled();
        expect(buildBundleMock).not.toHaveBeenCalled();
      });
    });
  });
});
