'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import SearchBar from './SearchBar';

export default function TopBar() {
  const { t } = useTranslation();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="safe-top mx-auto flex h-16 w-full max-w-[430px] items-center gap-3 px-4">
        {/* Left: Menu Button */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
          aria-label="Menu"
        >
          <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: Search or Logo */}
        <div className="flex-1">
          {showSearch ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-3 shadow-sm shadow-slate-900/5">
              <SearchBar onClose={() => setShowSearch(false)} />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex h-11 w-full items-center rounded-2xl border border-transparent bg-white/70 px-4 text-sm text-slate-500 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('search')}
            </button>
          )}
        </div>

        {/* Right: Language Toggle */}
        <LanguageToggle />
      </div>
    </header>
  );
}
