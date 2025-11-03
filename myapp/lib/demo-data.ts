/**
 * Demo/Fallback Products
 * Used when API returns 0 items
 */

export interface L10n {
  ja: string;
  en: string;
  zh: string;
  th: string;
  ko: string;
}

export interface SimpleProduct {
  id: string;
  name: L10n;
  description: L10n;
  imageUrl?: string | null;
  price?: number | null;
}

export const DEMO_PRODUCTS: SimpleProduct[] = [
  {
    id: "demo-1",
    name: {
      ja: "サンプル錠",
      en: "Sample Tablets",
      zh: "示例片",
      th: "แท็บเล็ตตัวอย่าง",
      ko: "샘플 정"
    },
    description: {
      ja: "頭痛に。",
      en: "For headaches.",
      zh: "用于头痛。",
      th: "สำหรับปวดศีรษะ",
      ko: "두통에."
    },
    imageUrl: "/images/placeholder-1.png",
    price: 698
  },
  {
    id: "demo-2",
    name: {
      ja: "保湿ローション",
      en: "Moisturizing Lotion",
      zh: "保湿乳液",
      th: "โลชั่นให้ความชุ่มชื้น",
      ko: "보습 로션"
    },
    description: {
      ja: "敏感肌向け。",
      en: "For sensitive skin.",
      zh: "适合敏感肌。",
      th: "เหมาะกับผิวแพ้ง่าย",
      ko: "민감성 피부용."
    },
    imageUrl: "/images/placeholder-2.png",
    price: 980
  }
];
