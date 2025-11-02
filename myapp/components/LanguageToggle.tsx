'use client';

import { useState } from 'react';
import { useAppStore, type Language } from '@/lib/store';
import { useTranslation } from 'react-i18next';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useAppStore();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const handleChange = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-fg/5 active:bg-fg/10 text-xl"
        aria-label="Change language"
      >
        {currentLang.flag}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-bg border border-fg/10 rounded-lg shadow-lg z-50 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-fg/5 active:bg-fg/10 ${
                  lang.code === language ? 'bg-accent/10 text-accent' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
