import { describe, expect, it } from "vitest";
import { MAX_LEGAL_TEXT_LENGTH, sanitizeLocalized, sanitizeText } from "../lawSafe";

describe("sanitizeText", () => {
  it("removes banned phrases", () => {
    const input = "このクリームは治るし効くと言われています。";
    expect(sanitizeText(input)).toBe("このクリームはと言われています。".trim());
  });

  it("preserves allowed phrases", () => {
    const input = "一時的に和らげる効果で肌をすこやかに保つクリーム。";
    expect(sanitizeText(input)).toBe(input);
  });

  it("truncates overly long text", () => {
    const input = "A".repeat(MAX_LEGAL_TEXT_LENGTH + 10);
    expect(sanitizeText(input)).toHaveLength(MAX_LEGAL_TEXT_LENGTH);
  });

  it("collapses whitespace and trims", () => {
    const input = " 効く   予防  最高 ";
    expect(sanitizeText(input)).toBe("最高");
  });
});

describe("sanitizeLocalized", () => {
  it("sanitizes each key while preserving structure", () => {
    const input = { ja: "治癒する", en: "Safe text" };
    expect(sanitizeLocalized(input)).toEqual({ ja: "", en: "Safe text" });
  });
});
