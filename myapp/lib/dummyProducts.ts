import type { Product } from './db';

const baseTimestamp = '2025-01-01T00:00:00.000Z';

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'demo-hydrate-serum',
    category: 'cosmetic',
    pointValue: 75,
    name: {
      en: 'Hydrate Boost Serum',
      ja: 'ハイドレートブーストセラム',
    },
    description: {
      en: 'Lightweight daily serum that keeps skin calm and balanced.',
      ja: '肌を落ち着かせてバランスを整える軽やかなデイリーセラム。',
    },
    effects: {
      en: 'Instant moisture\nComfort barrier\nNo residue',
      ja: '即時保湿\nバリアを整える\nべたつきなし',
    },
    sideEffects: {
      en: 'Rare tingling on very dry skin.',
    },
    goodFor: {
      en: 'Daily hydration\nPost-flight recovery\nMinimal routines',
    },
    tags: ['hydration', 'daily', 'calming'],
    updatedAt: baseTimestamp,
    syncedAt: baseTimestamp,
  },
  {
    id: 'demo-focus-gummies',
    category: 'health',
    pointValue: 60,
    name: {
      en: 'Focus Gummies',
      ja: 'フォーカスグミ',
    },
    description: {
      en: 'Zero sugar chew packed with L-theanine and B12.',
      ja: 'L-テアニンとB12を配合したシュガーフリーグミ。',
    },
    effects: {
      en: 'Keeps mind clear\nSmooth afternoon energy',
    },
    sideEffects: {
      en: 'Avoid late-night servings to prevent restlessness.',
    },
    goodFor: {
      en: 'Deep work blocks\nStudents\nFlight crews',
    },
    tags: ['focus', 'travel', 'daily'],
    updatedAt: baseTimestamp,
    syncedAt: baseTimestamp,
  },
  {
    id: 'demo-reset-balm',
    category: 'cosmetic',
    pointValue: 90,
    name: {
      en: 'Reset Night Balm',
      ja: 'リセットナイトバーム',
    },
    description: {
      en: 'Melting night treatment that seals moisture without heaviness.',
      ja: '重さのない保護膜で湿度を閉じ込める夜用トリートメント。',
    },
    effects: {
      en: 'Plush finish\nSoftens dry patches\nProtects overnight',
    },
    sideEffects: {
      en: 'Patch test recommended for sensitive skin.',
    },
    goodFor: {
      en: 'Cold climates\nPM routines\nMakeup prep',
    },
    tags: ['night', 'repair', 'skin'],
    updatedAt: baseTimestamp,
    syncedAt: baseTimestamp,
  },
];
