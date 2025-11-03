'use client';

import { useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from '@/lib/hooks';
import { db, type Product } from '@/lib/db';

export default function ComparePage() {
  const { t } = useTranslation();
  const compareIds = useAppStore((state) => state.compareIds);
  const language = useAppStore((state) => state.language);
  const removeFromCompare = useAppStore((state) => state.removeFromCompare);
  const clearCompare = useAppStore((state) => state.clearCompare);

  const products = useLiveQuery(async () => {
    if (compareIds.length === 0) {
      return [] as Product[];
    }
    const result = await db.products.bulkGet(compareIds);
    return result.filter(Boolean) as Product[];
  }, [compareIds]);

  const comparisonReady = (products?.length ?? 0) >= 2;

  const rows = useMemo(() => {
    if (!products || products.length === 0) return [];
    const fieldConfig: Array<{ key: keyof Product | 'pointValue'; label: string; format: (product: Product) => string }> = [
      {
        key: 'pointValue',
        label: t('pointValue'),
        format: (product) => `${product.pointValue}`,
      },
      {
        key: 'description',
        label: t('description'),
        format: (product) => getLocalized(product.description, language),
      },
      {
        key: 'effects',
        label: t('effects'),
        format: (product) => getLocalized(product.effects, language),
      },
      {
        key: 'sideEffects',
        label: t('sideEffects'),
        format: (product) => getLocalized(product.sideEffects, language),
      },
      {
        key: 'goodFor',
        label: t('goodFor'),
        format: (product) => getLocalized(product.goodFor, language),
      },
      {
        key: 'tags',
        label: t('tags'),
        format: (product) => (product.tags.length ? product.tags.join(', ') : '—'),
      },
    ];

    return fieldConfig.map((config) => ({
      label: config.label,
      values: products.map((product) => config.format(product)),
    }));
  }, [products, language, t]);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-fg">{t('compare')}</h1>
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="rounded-lg border border-fg/20 px-3 py-2 text-sm font-medium text-fg/70 hover:bg-fg/5"
              >
                {t('clearCompare')}
              </button>
            )}
          </div>
          <p className="text-sm text-fg/60">
            {comparisonReady ? `${products?.length ?? 0} ${t('products')}` : t('selectProducts')}
          </p>
        </header>

        {(!products || products.length === 0) && (
          <EmptyState message={t('selectProducts')} />
        )}

        {products && products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-bg px-4 py-3 font-medium text-fg/70">
                    {t('products')}
                  </th>
                  {products.map((product) => (
                    <th key={product.id} className="px-4 py-3 text-fg">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{product.name.en ?? Object.values(product.name)[0] ?? '—'}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(product.id)}
                          className="rounded-md border border-fg/10 px-2 py-1 text-xs text-fg/60 hover:bg-fg/5"
                        >
                          {t('removeFromCompare')}
                        </button>
                      </div>
                      <p className="text-xs text-fg/50 mt-1 capitalize">{product.category}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th className="sticky left-0 z-10 bg-bg px-4 py-3 align-top text-xs font-semibold uppercase tracking-wide text-fg/50">
                      {row.label}
                    </th>
                    {row.values.map((value, idx) => (
                      <td key={`${row.label}-${idx}`} className="px-4 py-3 align-top text-sm text-fg/80">
                        {value || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function getLocalized(
  value: Record<string, string>,
  language: string,
) {
  if (value?.[language]) return value[language];
  if (value?.en) return value.en;
  const first = value ? Object.values(value)[0] : '';
  return first ?? '';
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-fg/10 bg-fg/5 p-8 text-center text-fg/60">
      <svg className="mb-4 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
