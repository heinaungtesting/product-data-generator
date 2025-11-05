'use client';

import Image from 'next/image';
import { type Product } from '@/lib/db';

interface CompareDrawerProps {
  products: Product[];
  language: string;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export default function CompareDrawer({ products, language, onClose, onRemove }: CompareDrawerProps) {
  if (products.length === 0) return null;

  const gridClass = products.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-safe">
      <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[32px] border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/70 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Compare products</p>
            <p className="text-xs text-slate-500">{products.length} / 2 selected</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600"
          >
            Clear
          </button>
        </div>

        <div className={`grid grid-cols-1 gap-4 px-4 py-4 ${gridClass}`}>
          {products.map((product) => (
            <article key={product.id} className="space-y-3 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-inner shadow-slate-200">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src="/images/placeholder.png"
                  alt={product.name[language] || product.name.ja}
                  fill
                  sizes="(min-width: 768px) 40vw, 80vw"
                  className="object-cover"
                  onError={(event) => {
                    event.currentTarget.src = '/images/placeholder.png';
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                  <span>{product.category}</span>
                  {product.pointValue && <span className="font-semibold text-indigo-600">{product.pointValue} pts</span>}
                </div>

                <h4 className="text-lg font-semibold text-slate-900">
                  {product.name[language] || product.name.ja}
                </h4>

                <p className="text-sm text-slate-500 line-clamp-3">
                  {product.description[language] || product.description.ja}
                </p>

                {(product.effects[language] || product.effects.ja) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Effects</p>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {product.effects[language] || product.effects.ja}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => onRemove(product.id)}
                className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
