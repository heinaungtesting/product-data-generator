/**
 * Shared constants for the application
 */

import type { Language } from './store';

export const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇺🇸',
  zh: '🇨🇳',
  ko: '🇰🇷',
  th: '🇹🇭',
  ja: '🇯🇵',
};

export const LANGUAGE_OPTIONS: Array<{ code: Language; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: LANGUAGE_FLAGS.en },
  { code: 'zh', label: '中文', flag: LANGUAGE_FLAGS.zh },
  { code: 'ko', label: '한국어', flag: LANGUAGE_FLAGS.ko },
  { code: 'th', label: 'ไทย', flag: LANGUAGE_FLAGS.th },
  { code: 'ja', label: '日本語', flag: LANGUAGE_FLAGS.ja },
];
