'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Virtuoso } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/AppShell';
import ListRow from '@/components/ListRow';
import { db, searchProducts } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { syncNow } from '@/lib/sync';
import { triggerHaptic } from '@/lib/store';

export default function HomePage() {
  const { t } = useTranslation();
  const { searchQuery, isSyncing, setIsSyncing, setLastSyncTime } = useAppStore();
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'health' | 'cosmetic'>('all');

  // Live query products
  const products = useLiveQuery(
    async () => {
      if (searchQuery.trim()) {
        return searchProducts(searchQuery, useAppStore.getState().language);
      }

      let query = db.products.orderBy('updatedAt').reverse();

      if (categoryFilter !== 'all') {
        return query.filter(p => p.category === categoryFilter).toArray();
      }

      return query.toArray();
    },
    [searchQuery, categoryFilter]
  );

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    triggerHaptic('medium');

    const result = await syncNow();

    if (result.success) {
      setLastSyncTime(new Date().toISOString());
      if (result.updated) {
        triggerHaptic('heavy');
      }
    }

    setIsSyncing(false);
  }, [setIsSyncing, setLastSyncTime]);

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Header Stats */}
        <div className="flex items-center justify-between p-4 border-b border-fg/10">
          <div>
            <h1 className="text-2xl font-bold text-fg">{t('products')}</h1>
            <p className="text-sm text-fg/60">{products?.length || 0} items</p>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium disabled:opacity-50 min-h-[44px]"
          >
            {isSyncing ? t('syncing') : t('sync')}
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 p-4 border-b border-fg/10 overflow-x-auto">
          {['all', 'health', 'cosmetic'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap min-h-[44px] ${
                categoryFilter === cat
                  ? 'bg-accent text-white'
                  : 'bg-fg/5 text-fg hover:bg-fg/10'
              }`}
            >
              {cat === 'all' ? 'All' : t(cat)}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-hidden">
          {!products ? (
            <div className="flex items-center justify-center h-full text-fg/40">
              Loading...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-fg/40 gap-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>{t('noData')}</p>
              <button
                onClick={handleSync}
                className="px-6 py-3 bg-accent text-white rounded-lg font-medium"
              >
                {t('sync')}
              </button>
            </div>
          ) : (
            <Virtuoso
              data={products}
              itemContent={(index, product) => (
                <ListRow key={product.id} product={product} />
              )}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
