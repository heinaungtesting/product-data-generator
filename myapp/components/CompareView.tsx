'use client';

import type { Product } from '@/lib/db';
import type { Language } from '@/lib/store';

interface CompareViewProps {
  leftProduct: Product;
  rightProduct: Product;
  language: Language;
  onClose: () => void;
  onSelectLeft: () => void;
  onSelectRight: () => void;
  onSelectBoth: () => void;
}

export default function CompareView({
  leftProduct,
  rightProduct,
  language,
  onClose,
  onSelectLeft,
  onSelectRight,
  onSelectBoth,
}: CompareViewProps) {
  const getName = (product: Product) => {
    return product.name[language] || product.name.en || product.name.ja || 'Unnamed';
  };

  const getCategory = (category: string) => {
    return category === 'health' ? '💊 Health' : '💄 Beauty';
  };

  const getSalesMessage = () => {
    return rightProduct.salesMessage?.[language] || 
           rightProduct.salesMessage?.en || 
           '';
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">⚖️ Compare Products</h2>
            <p className="text-xs opacity-90">
              比较 / 비교 / เปรียบเทียบ
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-bold transition hover:bg-white/30"
            aria-label="Close comparison"
          >
            ×
          </button>
        </div>
      </div>

      {/* Comparison Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl">
          {/* Products Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Product - Customer's Choice */}
            <div className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-lg">
              <div className="mb-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer&apos;s Choice
                </p>
                <p className="text-2xs text-slate-400">
                  客户选择 / 고객 선택 / ลูกค้าเลือก
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100">
                  <span className="text-4xl opacity-30">📦</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {getName(leftProduct)}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {getCategory(leftProduct.category)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-blue-600">
                    {leftProduct.pointValue} points
                  </p>
                </div>
              </div>
            </div>

            {/* Right Product - Staff Recommendation */}
            <div className="relative rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-lg">
              <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-xl shadow-lg">
                ⭐
              </div>

              <div className="mb-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Staff Recommendation
                </p>
                <p className="text-2xs text-amber-600">
                  店员推荐 / 직원 추천 / พนักงานแนะนำ
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex h-32 items-center justify-center rounded-xl bg-white">
                  <span className="text-4xl opacity-40">📦</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {getName(rightProduct)}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {getCategory(rightProduct.category)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-blue-600">
                    {rightProduct.pointValue} points
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Message */}
          {getSalesMessage() && (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-4 shadow-md">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Staff says / 店员推荐:
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {getSalesMessage()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              onClick={onSelectLeft}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-600 px-4 py-4 text-white shadow-lg transition hover:bg-slate-700 active:scale-95"
            >
              <span className="text-2xl">👈</span>
              <span className="text-xs font-bold">Choose Left</span>
              <span className="text-2xs opacity-80">选择左边 / 왼쪽 선택</span>
            </button>

            <button
              onClick={onSelectBoth}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-4 text-white shadow-lg transition hover:from-green-600 hover:to-emerald-700 active:scale-95"
            >
              <span className="text-2xl">➕</span>
              <span className="text-xs font-bold">Add Both</span>
              <span className="text-2xs opacity-90">添加两个 / 둘 다 추가</span>
            </button>

            <button
              onClick={onSelectRight}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 px-4 py-4 text-white shadow-lg transition hover:from-amber-600 hover:to-yellow-700 active:scale-95"
            >
              <span className="text-2xl">👉⭐</span>
              <span className="text-xs font-bold">Choose Right</span>
              <span className="text-2xs opacity-90">选择右边 / 오른쪽 선택</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
