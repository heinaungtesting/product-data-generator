'use client';


import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/AppShell';

import ProductThumbnail from '@/components/ProductThumbnail';
import { useLiveQuery } from '@/lib/hooks';
import { db } from '@/lib/db';
import { useAppStore, type Language } from '@/lib/store';
import { syncNow } from '@/lib/sync';

const languageOptions: { code: Language; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'th', label: 'ไทย' },
  { code: 'ko', label: '한국어' },
];

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
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'health' | 'cosmetic'>('all');
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const dbProducts = useLiveQuery(
    async () => db.products.orderBy('updatedAt').reverse().toArray(),
    []
  );

  const products = useMemo(() => {
    if (!dbProducts) return null;

    let filtered = dbProducts;

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name[language]?.toLowerCase().includes(lower) ||
        product.description[language]?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [dbProducts, language, searchQuery, categoryFilter]);

  const totalProducts = dbProducts?.length ?? 0;

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      const result = await syncNow();

      if (result.success) {
        setLastSyncTime(new Date().toISOString());

        if (result.updated) {
          setSyncSuccess(`✅ Successfully synced ${result.productCount} products!`);
        } else {
          setSyncSuccess('✓ Already up to date!');
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSyncSuccess(null), 5000);
      } else {
        setSyncError(result.error || 'Sync failed');
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unexpected error occurred');
    } finally {
      setIsSyncing(false);
    }
  }, [setIsSyncing, setLastSyncTime]);

  const handleLanguageChange = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  const handleSaveToLog = useCallback(async (product: { id: string; name: Record<string, string>; category: string; pointValue?: number }) => {
    setSavingProductId(product.id);

    const timestamp = new Date().toISOString();
    const entry = {
      productId: product.id,
      productName: product.name[language] || product.name.ja || 'Unknown',
      category: product.category,
      timestamp,
      points: product.pointValue ?? 0,
    };

    try {
      await db.logs.add(entry);

      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Show success feedback briefly
      setTimeout(() => setSavingProductId(null), 1500);
    } catch (error) {
      console.error('Error saving log:', error);
      setSavingProductId(null);
    }
  }, [language]);



  const lastSyncLabel = lastSyncTime
    ? new Date(lastSyncTime).toLocaleString()
    : t('sync') + ' not run';

  return (
    <AppShell>
      <div className="relative space-y-6">
        {/* Search Section */}
        <section className="space-y-4">
          <div className="relative">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products"
              className="w-full h-14 px-5 pr-12 rounded-3xl border-none bg-white/95 text-base text-slate-900 placeholder:text-slate-400 shadow-lg shadow-indigo-500/5 backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <svg
              className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-2 border-indigo-600'
                  : 'bg-white/80 text-slate-600 border-2 border-slate-200'
              }`}
            >
              all
            </button>
            <button
              onClick={() => setCategoryFilter('health')}
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                categoryFilter === 'health'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-2 border-indigo-600'
                  : 'bg-white/80 text-slate-600 border-2 border-slate-200'
              }`}
            >
              Health
            </button>
            <button
              onClick={() => setCategoryFilter('cosmetic')}
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                categoryFilter === 'cosmetic'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-2 border-indigo-600'
                  : 'bg-white/80 text-slate-600 border-2 border-slate-200'
              }`}
            >
              Cosmetic
            </button>
          </div>
        </section>

        {/* Sync Status Messages */}
        {syncSuccess && (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium animate-in fade-in slide-in-from-top-2">
            {syncSuccess}
          </div>
        )}

        {syncError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 animate-in fade-in slide-in-from-top-2">
            <p className="font-semibold">Sync Failed</p>
            <p className="mt-1 text-xs">{syncError}</p>
          </div>
        )}

        {/* Product Grid */}
        <section>
          {!products ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[32px] border border-white/60 bg-white/70 p-4 shadow-inner shadow-slate-200 animate-pulse"
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
            <div className="rounded-[32px] border-2 border-dashed border-indigo-200 bg-white/80 p-10 text-center shadow-md shadow-indigo-100">
              <p className="text-lg font-semibold text-slate-900">No products match your search</p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different keyword or sync the latest bundle to refresh the catalog.
              </p>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <span className="inline-block animate-spin">↻</span>
                    Syncing...
                  </>
                ) : (
                  'Sync now'
                )}
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="group rounded-[32px] border border-white/70 bg-white/95 p-4 shadow-lg shadow-indigo-500/5 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <button
                    onClick={() => router.push(`/product/${product.id}`)}
                    className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label={`View details for ${product.name[language] || product.name.ja}`}
                  >
                    <ProductThumbnail
                      productId={product.id}
                      productName={product.name[language] || product.name.ja}
                      className="absolute inset-0"
                    />
                  </button>

                  <div className="mt-4 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {product.name[language] || product.name.ja}
                    </h3>

                    <p className="text-xs text-slate-500 uppercase tracking-wide">
                      {product.category}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveToLog(product);
                      }}
                      disabled={savingProductId === product.id}
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                        savingProductId === product.id
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      {savingProductId === product.id ? '✓ Saved!' : 'Save to log'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Floating Sync Button */}
        {totalProducts > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 h-14 px-6 rounded-full bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white font-semibold shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-60 hover:shadow-indigo-500/60"
              title={`Last synced: ${lastSyncLabel}`}
            >
              {isSyncing ? (
                <span className="inline-block animate-spin text-xl">↻</span>
              ) : (
                <span className="text-xl">↻</span>
              )}
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
