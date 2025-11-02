'use client';

import { useEffect, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { autoSync } from '@/lib/sync';

export default function Providers({ children }: { children: ReactNode }) {
  const { language, theme } = useAppStore();

  useEffect(() => {
    // Set initial language
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    // Apply theme
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Auto-sync on mount
    autoSync();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
