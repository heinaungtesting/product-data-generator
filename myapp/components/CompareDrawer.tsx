'use client';

import { type Product } from '@/lib/db';

interface CompareDrawerProps {
  products: Product[];
  language: string;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export default function CompareDrawer({ products, language, onClose, onRemove }: CompareDrawerProps) {
  if (products.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      <div className="bg-white border-t-2 border-gray-200 shadow-2xl max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Compare Products</h3>
            <p className="text-sm text-gray-500">{products.length} of 2 selected</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] font-medium"
          >
            Clear
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-4">
          <div className={`grid gap-4 ${products.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {products.map((product) => (
              <div key={product.id} className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                {/* Image */}
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src="/images/placeholder.png"
                    alt={product.name[language] || product.name.ja}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.png';
                    }}
                  />
                </div>

                {/* Name */}
                <h4 className="font-semibold text-gray-900">
                  {product.name[language] || product.name.ja}
                </h4>

                {/* Price */}
                {product.pointValue && (
                  <p className="text-lg font-bold text-blue-600">
                    {product.pointValue} pts
                  </p>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {product.description[language] || product.description.ja}
                  </p>
                </div>

                {/* Effects */}
                {(product.effects[language] || product.effects.ja) && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Effects</p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {product.effects[language] || product.effects.ja}
                    </p>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => onRemove(product.id)}
                  className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
