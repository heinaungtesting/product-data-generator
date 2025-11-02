'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import LanguageToggle from './LanguageToggle';
import SearchBar from './SearchBar';

export default function TopBar() {
  const { t } = useTranslation();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-fg/10">
      <div className="flex items-center justify-between h-14 px-4 safe-top">
        {/* Left: Menu Button */}
        <button
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-fg/5 active:bg-fg/10"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: Search or Logo */}
        <div className="flex-1 mx-4">
          {showSearch ? (
            <SearchBar onClose={() => setShowSearch(false)} />
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full h-9 px-3 flex items-center bg-fg/5 rounded-lg text-fg/50 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
