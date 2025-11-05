'use client';

import Image from 'next/image';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/AppShell';
import CompareDrawer from '@/components/CompareDrawer';
import { useLiveQuery } from '@/lib/hooks';
import { db, type Product } from '@/lib/db';
import { useAppStore, type Language } from '@/lib/store';
import { syncNow } from '@/lib/sync';

const languageOptions: { code: Language; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'th', label: 'ไทย' },
  { code: 'ko', label: '한국어' },
];

function getInitialCompareIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = sessionStorage.getItem('compare');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const {
    isSyncing,
    setIsSyncing,
    setLastSyncTime,
    lastSyncTime,
    language,
    setLanguage,
  } = useAppStore();

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>(getInitialCompareIds);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    sessionStorage.setItem('compare', JSON.stringify(compareIds));
  }, [compareIds]);

  const dbProducts = useLiveQuery(
    async () => db.products.orderBy('updatedAt').reverse().toArray(),
    []
  );

  const products = useMemo(() => {
    if (!dbProducts) return null;
    if (!searchQuery) return dbProducts;

    const lower = searchQuery.toLowerCase();
    return dbProducts.filter((product) =>
      product.name[language]?.toLowerCase().includes(lower) ||
      product.description[language]?.toLowerCase().includes(lower)
    );
  }, [dbProducts, language, searchQuery]);

  const totalProducts = dbProducts?.length ?? 0;

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncNow();
      if (result.success) {
        setLastSyncTime(new Date().toISOString());
      }
    } finally {
      setIsSyncing(false);
    }
  }, [setIsSyncing, setLastSyncTime]);

  const handleLanguageChange = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
  }, []);

  const compareProducts = useMemo(() => {
    if (!dbProducts) return [];
    return compareIds
      .map((id) => dbProducts.find((product) => product.id === id))
      .filter(Boolean) as Product[];
  }, [compareIds, dbProducts]);

  const lastSyncLabel = lastSyncTime
    ? new Date(lastSyncTime).toLocaleString()
    : t('sync') + ' not run';

  return (
    <AppShell>
      <div className="relative space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-indigo-100 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                {t('products')}
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                Product intelligence at a glance
              </h1>
              <p className="text-slate-500">
                Search, filter, and keep your offline catalog in sync with a single tap. Designed for fast on-the-go workflows.
              </p>
            </div>

            <div className="w-full space-y-4 lg:max-w-md">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500">Search</span>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-indigo-100 bg-white px-4 shadow-inner shadow-indigo-100/70">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Find supplements, cosmetics, ingredients..."
                    className="flex-1 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </label>

              <div className="flex flex-wrap gap-2">
                {languageOptions.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => handleLanguageChange(item.code)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      language === item.code
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 px-6 py-4 text-white shadow-xl shadow-indigo-500/40 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSyncing ? 'Syncing data…' : 'Sync latest bundle'}
                <span aria-hidden className="text-xl">↻</span>
              </button>

              <p className="text-xs text-slate-500">
                Last synced: <span className="font-medium text-slate-700">{lastSyncLabel}</span>
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Products', value: totalProducts, hint: 'Synced locally' },
              { label: 'Selected', value: compareIds.length, hint: 'Compare slots used' },
              { label: 'Languages', value: languageOptions.length, hint: 'Supported locales' },
              { label: 'Search hits', value: products?.length ?? 0, hint: 'Matching records' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-900/5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          {!products ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-inner shadow-slate-200 animate-pulse"
                >
                  <div className="aspect-[4/3] rounded-2xl bg-slate-100" />
                  <div className="mt-4 space-y-3">
                    <div className="h-4 rounded bg-slate-100" />
                    <div className="h-4 rounded bg-slate-100" />
                    <div className="h-10 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-indigo-200 bg-white/80 p-10 text-center shadow-md shadow-indigo-100">
              <p className="text-lg font-semibold text-slate-900">No products match your search</p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different keyword or sync the latest bundle to refresh the catalog.
              </p>
              <button
                onClick={handleSync}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-white shadow-lg shadow-indigo-500/30"
              >
                Sync now
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <article
                  key={product.id}
                  className="group rounded-[30px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <button
                    onClick={() => router.push(`/product/${product.id}`)}
                    className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label={`View details for ${product.name[language] || product.name.ja}`}
                  >
                    <Image
                      src="/images/placeholder.png"
                      alt={product.name[language] || product.name.ja}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                  </button>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                      <span>{product.category}</span>
                      {product.pointValue && (
                        <span className="font-semibold text-indigo-600">{product.pointValue} pts</span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                      {product.name[language] || product.name.ja}
                    </h3>

                    <p className="text-sm text-slate-500 line-clamp-3 min-h-[3.5rem]">
                      {product.description[language] || product.description.ja}
                    </p>

                    {product.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {product.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <button
                      onClick={() => toggleCompare(product.id)}
                      disabled={compareIds.length >= 2 && !compareIds.includes(product.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        compareIds.includes(product.id)
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                          : compareIds.length >= 2
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {compareIds.includes(product.id) ? 'Added to compare' : 'Add to compare'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {compareIds.length > 0 && (
          <CompareDrawer
            products={compareProducts}
            language={language}
            onClose={clearCompare}
            onRemove={toggleCompare}
          />
        )}
      </div>
    </AppShell>
  );
}
