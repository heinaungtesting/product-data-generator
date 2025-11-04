'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLiveQuery } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import CompareDrawer from '@/components/CompareDrawer';
import { db, searchProducts, type Product } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { syncNow } from '@/lib/sync';

export default function HomePage() {
  const router = useRouter();
  const { isSyncing, setIsSyncing, setLastSyncTime, language } = useAppStore();
  const [localSearch, setLocalSearch] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Load compare from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('compare');
    if (saved) {
      try {
        setCompareIds(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save compare to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('compare', JSON.stringify(compareIds));
  }, [compareIds]);

  // Live query products from DB
  const dbProducts = useLiveQuery(
    async () => {
      return db.products.orderBy('updatedAt').reverse().toArray();
    },
    []
  );

  // Filter products by search
  const products = useMemo(() => {
    if (!dbProducts) return null;

    let items = dbProducts;

    if (localSearch.trim()) {
      const query = localSearch.toLowerCase();
      items = items.filter(p =>
        p.name[language]?.toLowerCase().includes(query) ||
        p.description[language]?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [dbProducts, language, localSearch]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    const result = await syncNow();
    if (result.success) {
      setLastSyncTime(new Date().toISOString());
    }
    setIsSyncing(false);
  }, [setIsSyncing, setLastSyncTime]);

  const handleSearchChange = useCallback((query: string) => {
    setTimeout(() => setLocalSearch(query), 250);
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 2) {
        return prev; // Max 2 items
      }
      return [...prev, id];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
  }, []);

  const compareProducts = useMemo(() => {
    if (!dbProducts) return [];
    return compareIds.map(id => dbProducts.find(p => p.id === id)).filter(Boolean) as Product[];
  }, [compareIds, dbProducts]);

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white">
          {/* Search */}
          <div className="p-4">
            <input
              type="search"
              placeholder="Search products..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
            />
          </div>

          {/* Language Toggle */}
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
            {(['ja', 'en', 'zh', 'th', 'ko'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  useAppStore.setState({ language: lang });
                  localStorage.setItem('ui.lang', lang);
                }}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  language === lang
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label={`Switch to ${lang.toUpperCase()}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sync Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-blue-700 active:scale-[0.98] min-h-[44px] shadow-lg shadow-blue-600/20"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {!products ? (
            // Loading skeletons
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 font-medium">No products found</p>
                <button
                  onClick={handleSync}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Sync Now
                </button>
              </div>
            </div>
          ) : (
            // Product cards
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image - clickable to detail */}
                  <button
                    onClick={() => router.push(`/product/${product.id}`)}
                    className="w-full aspect-square relative bg-gray-100 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    aria-label={`View details for ${product.name[language]}`}
                  >
                    <img
                      src="/images/placeholder.png"
                      alt={product.name[language] || product.name.ja}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                  </button>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
                      {product.name[language] || product.name.ja}
                    </h3>

                    {/* Compare Button */}
                    <button
                      onClick={() => toggleCompare(product.id)}
                      disabled={compareIds.length >= 2 && !compareIds.includes(product.id)}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-all min-h-[44px] ${
                        compareIds.includes(product.id)
                          ? 'bg-gray-900 text-white'
                          : compareIds.length >= 2
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {compareIds.includes(product.id) ? 'Selected' : 'Compare'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compare Drawer */}
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
