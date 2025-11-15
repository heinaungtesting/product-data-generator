'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/AppShell';
import { useLiveQuery } from '@/lib/hooks';
import { db, type Product } from '@/lib/db';
import { useAppStore, type Language } from '@/lib/store';
import { syncNow } from '@/lib/sync';

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
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'points'>('recent');

  const languageOptions: Array<{ code: Language; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Auto-sync on first load if database is empty
  useEffect(() => {
    const checkAndSync = async () => {
      const hasRunFirstSync = localStorage.getItem('hasRunFirstSync');
      if (hasRunFirstSync) return;

      try {
        const count = await db.products.count();

        if (count === 0 && !isSyncing) {
          console.log('First load detected - auto-syncing products...');
          setIsSyncing(true);

          const result = await syncNow();

          if (result.success) {
            setLastSyncTime(new Date().toISOString());
            setSyncSuccess(`Welcome! Loaded ${result.productCount} products`);
            localStorage.setItem('hasRunFirstSync', 'true');
            setTimeout(() => setSyncSuccess(null), 5000);
          } else {
            setSyncError(result.error || 'Initial sync failed. Please try manual sync.');
          }

          setIsSyncing(false);
        }
      } catch (error) {
        console.error('Error during first-load sync:', error);
        setIsSyncing(false);
      }
    };

    checkAndSync();
  }, [isSyncing, setIsSyncing, setLastSyncTime]);

  const dbProducts = useLiveQuery(
    async () => db.products.orderBy('updatedAt').reverse().toArray(),
    []
  );

  const resolveName = useCallback((product: Product, lang: Language) => {
    if (!product?.name) return 'Unnamed product';
    const direct = product.name[lang];
    if (direct) return direct;
    const fallbacks: Array<string | undefined> = [
      product.name.en,
      product.name.ja,
      ...Object.values(product.name),
    ];
    const found = fallbacks.find(Boolean);
    return found ?? 'Unnamed product';
  }, []);

  const products = useMemo(() => {
    if (!dbProducts) return null;

    let filtered = dbProducts;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        const name = resolveName(product, language).toLowerCase();
        const description =
          product.description?.[language]?.toLowerCase() ||
          (Object.values(product.description ?? {}).find((value): value is string => Boolean(value))?.toLowerCase() ?? '');
        const effects =
          product.effects?.[language]?.toLowerCase() ||
          (Object.values(product.effects ?? {}).find((value): value is string => Boolean(value))?.toLowerCase() ?? '');
        const sideEffects =
          product.sideEffects?.[language]?.toLowerCase() ||
          (Object.values(product.sideEffects ?? {}).find((value): value is string => Boolean(value))?.toLowerCase() ?? '');
        const goodFor =
          product.goodFor?.[language]?.toLowerCase() ||
          (Object.values(product.goodFor ?? {}).find((value): value is string => Boolean(value))?.toLowerCase() ?? '');
        const tags = product.tags?.map(t => t.toLowerCase()).join(' ') ?? '';

        return (
          name.includes(lower) ||
          description.includes(lower) ||
          effects.includes(lower) ||
          sideEffects.includes(lower) ||
          goodFor.includes(lower) ||
          tags.includes(lower)
        );
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = resolveName(a, language);
        const nameB = resolveName(b, language);
        return nameA.localeCompare(nameB, language);
      } else if (sortBy === 'points') {
        const pointsA = a.pointValue ?? 0;
        const pointsB = b.pointValue ?? 0;
        return pointsB - pointsA;
      } else {
        return b.updatedAt.localeCompare(a.updatedAt);
      }
    });

    return sorted;
  }, [dbProducts, language, searchQuery, categoryFilter, sortBy, resolveName]);

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
          setSyncSuccess(`Successfully synced ${result.productCount} products!`);
        } else {
          setSyncSuccess('Already up to date!');
        }

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

  const handleLanguageChange = useCallback((code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  }, [setLanguage, i18n]);

  const handleOpenProduct = useCallback((productId: string) => {
    router.push(`/product/${productId}`);
  }, [router]);

  const handleSaveToLog = useCallback(async (product: Product) => {
    setSavingProductId(product.id);

    const timestamp = new Date().toISOString();
    const productName = resolveName(product, language);

    const entry = {
      productId: product.id,
      productName,
      category: product.category,
      timestamp,
      points: product.pointValue ?? 0,
    };

    try {
      await db.logs.add(entry);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      setTimeout(() => setSavingProductId(null), 1500);
    } catch (error) {
      console.error('Error saving log:', error);
      setSavingProductId(null);
    }
  }, [language, resolveName]);

  const lastSyncLabel = lastSyncTime
    ? new Date(lastSyncTime).toLocaleString()
    : t('sync') + ' not run';

  return (
    <AppShell>
      <div className="relative space-y-7">
        {/* Search Section with Glass Effect */}
        <section className="space-y-5 animate-scale-in">
          {/* Search Input */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-brand rounded-[2rem] opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
            <div className="relative">
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products, effects, ingredients..."
                className="input-field h-16 text-base pr-14 shadow-soft-lg"
                aria-label="Search products by name, effects, or ingredients"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-100">
                <svg
                  className="h-5 w-5 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Language Selector Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => handleLanguageChange(option.code)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-300 focus-ring ${
                  language === option.code
                    ? 'bg-gradient-brand text-white shadow-brand scale-105'
                    : 'glass text-slate-700 hover:bg-white hover:scale-105 active:scale-95 shadow-soft'
                }`}
              >
                <span className="text-base">{option.flag}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {/* Category & Sort Controls */}
          <div className="glass-strong rounded-3xl p-4 shadow-soft-lg space-y-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
              <div className="flex items-center gap-2">
                {(['all', 'health', 'cosmetic'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold capitalize transition-all duration-300 ${
                      categoryFilter === cat
                        ? 'bg-gradient-brand text-white shadow-brand scale-105'
                        : 'bg-white/70 text-slate-600 hover:bg-white hover:scale-105 active:scale-95 border border-slate-200/50'
                    }`}
                  >
                    {cat === 'health' ? '💊 Health' : cat === 'cosmetic' ? '💄 Cosmetic' : '✨ All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-2">
              <label htmlFor="sort-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'points')}
                className="w-full rounded-2xl px-4 py-3 bg-white border-2 border-slate-200/50 text-sm font-semibold text-slate-700 shadow-inner-soft focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all cursor-pointer"
              >
                <option value="recent">🕐 Recently Added</option>
                <option value="name">🔤 Name (A-Z)</option>
                <option value="points">⭐ Points (High to Low)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Sync Status Messages */}
        {syncSuccess && (
          <div className="card rounded-3xl px-5 py-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-soft animate-slide-down">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <p className="text-sm font-bold text-emerald-800">{syncSuccess}</p>
            </div>
          </div>
        )}

        {syncError && (
          <div className="card rounded-3xl px-5 py-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-soft animate-slide-down">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">Sync Failed</p>
                <p className="mt-1 text-xs text-red-600">{syncError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <section className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {!products ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="card rounded-4xl p-5 animate-pulse"
                >
                  <div className="aspect-[4/3] rounded-3xl skeleton" />
                  <div className="mt-5 space-y-3">
                    <div className="h-5 rounded-full skeleton" />
                    <div className="h-4 w-3/4 rounded-full skeleton" />
                    <div className="h-12 rounded-2xl skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card rounded-5xl p-12 text-center border-2 border-dashed border-brand-200 bg-gradient-brand-subtle shadow-soft-lg">
              {totalProducts === 0 ? (
                <>
                  <div className="mb-6 text-6xl animate-float">📦</div>
                  <h2 className="text-2xl font-bold text-slate-900 text-gradient">Welcome to MyApp!</h2>
                  <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-md mx-auto">
                    Your product catalog is empty. Click the button below to sync and load products from the server.
                  </p>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="btn-primary mt-8 px-10 py-4 text-base shadow-brand-lg"
                  >
                    {isSyncing ? (
                      <>
                        <span className="inline-block animate-spin text-xl mr-2">↻</span>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <span className="text-xl mr-2">⬇</span>
                        Load Products
                      </>
                    )}
                  </button>
                </>
              ) : searchQuery || categoryFilter !== 'all' ? (
                <>
                  <div className="mb-6 text-6xl animate-float">🔍</div>
                  <h2 className="text-2xl font-bold text-slate-900">No matching products</h2>
                  <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    {searchQuery && categoryFilter !== 'all'
                      ? `No products found matching "${searchQuery}" in ${categoryFilter} category.`
                      : searchQuery
                      ? `No products found matching "${searchQuery}".`
                      : `No ${categoryFilter} products found.`}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchInput('')}
                        className="btn-secondary"
                      >
                        Clear Search
                      </button>
                    )}
                    {categoryFilter !== 'all' && (
                      <button
                        onClick={() => setCategoryFilter('all')}
                        className="btn-secondary"
                      >
                        Show All Categories
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6 text-6xl">❓</div>
                  <h2 className="text-xl font-bold text-slate-900">No products available</h2>
                  <p className="mt-3 text-sm text-slate-600">
                    Try syncing the latest bundle to refresh the catalog.
                  </p>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="btn-primary mt-6"
                  >
                    {isSyncing ? (
                      <>
                        <span className="inline-block animate-spin mr-2">↻</span>
                        Syncing...
                      </>
                    ) : (
                      'Sync now'
                    )}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {products.map((product, index) => {
                const displayName = resolveName(product, language);
                const initials =
                  displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) => word[0]?.toUpperCase() ?? '')
                    .join('') || 'P';

                return (
                  <article
                    key={product.id}
                    className="card-interactive rounded-4xl p-5 animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Product Image/Placeholder */}
                    <button
                      type="button"
                      onClick={() => handleOpenProduct(product.id)}
                      className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-mesh from-brand-100 via-accent-100 to-brand-200 focus-ring transition-all duration-300 hover:scale-[1.02]"
                      aria-label={`View details for ${displayName}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-black text-brand-600 drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                          {initials}
                        </span>
                      </div>
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    </button>

                    {/* Product Info */}
                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() => handleOpenProduct(product.id)}
                        className="text-left group w-full"
                      >
                        <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight group-hover:text-brand-600 transition-colors duration-200">
                          {displayName}
                        </h3>
                      </button>

                      {/* Category Badge */}
                      <div>
                        <span className={`badge ${
                          product.category === 'health'
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200'
                            : 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border border-pink-200'
                        }`}>
                          {product.category === 'health' ? '💊 Health' : '💄 Cosmetic'}
                        </span>
                      </div>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {product.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold bg-brand-50 text-brand-600 border border-brand-100"
                            >
                              {tag}
                            </span>
                          ))}
                          {product.tags.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold bg-slate-100 text-slate-500">
                              +{product.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Save Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveToLog(product);
                        }}
                        disabled={savingProductId === product.id}
                        className={`w-full rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-300 focus-ring ${
                          savingProductId === product.id
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-soft-lg scale-105'
                            : 'bg-gradient-brand text-white shadow-brand hover:shadow-brand-lg hover:scale-105 active:scale-95'
                        }`}
                      >
                        {savingProductId === product.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-lg">✓</span>
                            Saved!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            Save to Log
                          </span>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Floating Sync Button */}
        {totalProducts > 0 && (
          <div className="fixed bottom-8 right-8 z-50 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="group relative flex items-center gap-3 h-16 px-6 rounded-full bg-gradient-brand text-white font-bold shadow-brand-lg transition-all duration-300 hover:scale-110 hover:shadow-glow active:scale-95 disabled:opacity-60 focus-ring"
              title={`Last synced: ${lastSyncLabel}`}
              aria-label={`Sync products. Last synced: ${lastSyncLabel}`}
            >
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-brand opacity-50 blur-xl rounded-full group-hover:opacity-75 transition-opacity" />

              <span className={`relative text-2xl ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>
                ↻
              </span>
              <span className="relative hidden sm:inline">Sync</span>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
