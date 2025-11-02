'use client';

import Link from 'next/link';
import { type Product } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import TagChip from './TagChip';

interface ListRowProps {
  product: Product;
  showCheckbox?: boolean;
  isChecked?: boolean;
  onCheck?: (checked: boolean) => void;
}

export default function ListRow({ product, showCheckbox, isChecked, onCheck }: ListRowProps) {
  const { language } = useAppStore();

  const name = product.name[language] || product.name.en || '';
  const description = product.description[language] || product.description.en || '';

  return (
    <div className="flex items-center gap-3 p-4 bg-bg hover:bg-fg/5 active:bg-fg/10 border-b border-fg/10">
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onCheck?.(e.target.checked)}
          className="w-6 h-6 rounded accent-accent"
        />
      )}

      <Link href={`/detail/${product.id}`} className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-fg truncate">{name}</h3>
            <p className="text-sm text-fg/60 line-clamp-2 mt-1">{description}</p>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {product.tags.slice(0, 3).map((tag) => (
                  <TagChip key={tag} tag={tag} size="sm" />
                ))}
                {product.tags.length > 3 && (
                  <span className="text-xs text-fg/40">+{product.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 text-sm">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              product.category === 'health'
                ? 'bg-blue-500/10 text-blue-600'
                : 'bg-pink-500/10 text-pink-600'
            }`}>
              {product.category}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
