'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { db, searchProducts, type Product } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { syncNow } from '@/lib/sync';
import { DEMO_PRODUCTS, type SimpleProduct } from '@/lib/demo-data';

// Convert DB Product to SimpleProduct format
function toSimpleProduct(p: Product, lang: string): SimpleProduct {
  return {
    id: p.id,
    name: {
      ja: p.name.ja || '',
      en: p.name.en || '',
      zh: p.name.zh || '',
      th: p.name.th || '',
      ko: p.name.ko || ''
    },
    description: {
      ja: p.description.ja || '',
      en: p.description.en || '',
      zh: p.description.zh || '',
      th: p.description.th || '',
      ko: p.description.ko || ''
    },
    imageUrl: null,
    price: p.pointValue || null
  };
}

export default function HomePage() {
  const router = useRouter();
  const { searchQuery, isSyncing, setIsSyncing, setLastSyncTime, language } = useAppStore();
  const [localSearch, setLocalSearch] = useState('');

  // Live query products from DB
  const dbProducts = useLiveQuery(
    async () => {
      if (searchQuery.trim()) {
        return searchProducts(searchQuery, language);
      }
      return db.products.orderBy('updatedAt').reverse().toArray();
    },
    [searchQuery]
  );

  // Convert to SimpleProduct and apply local search filter
  const products = useMemo(() => {
    let items: SimpleProduct[];

    if (dbProducts && dbProducts.length > 0) {
      items = dbProducts.map(p => toSimpleProduct(p, language));
    } else {
      items = DEMO_PRODUCTS;
    }

    // Apply local search with debounce
    if (localSearch.trim()) {
      const query = localSearch.toLowerCase();
      items = items.filter(p =>
        p.name[language as keyof typeof p.name]?.toLowerCase().includes(query) ||
        p.description[language as keyof typeof p.description]?.toLowerCase().includes(query)
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
    // Debounce 250ms
    setTimeout(() => setLocalSearch(query), 250);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    router.push(`/product/${id}`);
  }, [router]);

  const currentLang = language as keyof SimpleProduct['name'];

  return (
    <AppShell>
      <div className="h-full flex flex-col animate-fade-in">
        {/* Search Bar */}
        <div className="p-4 border-b border-fg/10 animate-slide-down" style={{ animationDelay: '0ms' }}>
          <input
            type="search"
            placeholder="Search products..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-fg/5 text-fg placeholder:text-fg/40 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Language Toggle */}
        <div className="flex gap-2 p-4 border-b border-fg/10 animate-slide-down overflow-x-auto" style={{ animationDelay: '150ms' }}>
          {(['ja', 'en', 'zh', 'th', 'ko'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                useAppStore.setState({ language: lang });
                localStorage.setItem('ui.lang', lang);
              }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all hover:scale-105 ${
                language === lang
                  ? 'bg-accent text-white'
                  : 'bg-fg/5 text-fg hover:bg-fg/10'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Sync Button */}
        <div className="p-4 border-b border-fg/10 animate-slide-down" style={{ animationDelay: '300ms' }}>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full px-4 py-3 bg-accent text-white rounded-lg font-medium disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!dbProducts ? (
            // Loading skeletons
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-fg/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full text-fg/40">
              <p>No results</p>
            </div>
          ) : (
            // Product cards
            <div className="grid grid-cols-2 gap-4">
              {products.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleCardClick(product.id)}
                  className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-accent animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image */}
                  <div className="aspect-square bg-fg/5 relative overflow-hidden">
                    <img
                      src={product.imageUrl || '/images/placeholder.png'}
                      alt={product.name[currentLang]}
                      className="w-full h-full object-cover animate-fade-in"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3 flex-1 flex flex-col gap-1 text-left">
                    <h3 className="font-medium text-fg line-clamp-1">
                      {product.name[currentLang]}
                    </h3>
                    <p className="text-sm text-fg/60 line-clamp-2 flex-1">
                      {product.description[currentLang]}
                    </p>
                    {product.price && (
                      <p className="text-lg font-bold text-accent mt-1">
                        ¥{product.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
