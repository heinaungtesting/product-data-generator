'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, type Product } from '@/lib/db';
import { useAppStore, type Language } from '@/lib/store';

// Helper for view transitions
const navigateWithTransition = (router: ReturnType<typeof useRouter>, path: string) => {
  const navigate = () => router.push(path);

  // Use View Transitions API if available for smooth animations
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    (document as Document & { startViewTransition: (callback: () => void) => void })
      .startViewTransition(navigate);
  } else {
    navigate();
  }
};

const LANGUAGE_FLAGS = [
  { code: 'en' as Language, flag: '🇺🇸', label: 'EN' },
  { code: 'zh' as Language, flag: '🇨🇳', label: 'CN' },
  { code: 'ko' as Language, flag: '🇰🇷', label: 'KR' },
  { code: 'th' as Language, flag: '🇹🇭', label: 'TH' },
  { code: 'ja' as Language, flag: '🇯🇵', label: 'JP' },
];

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { language, setLanguage } = useAppStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadProduct = async () => {
      const id = params.id as string;
      try {
        const dbProduct = await db.products.get(id);
        setProduct(dbProduct || null);
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      }
      setLoading(false);
    };

    loadProduct();
  }, [params.id]);

  useEffect(() => {
    setSaveStatus('idle');
  }, [product?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-accent-50/30 to-white">
        <div className="relative">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <div className="absolute inset-0 h-20 w-20 animate-ping rounded-full border-4 border-brand-300 opacity-20" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-brand-50 via-accent-50/30 to-white p-6 text-center animate-scale-in">
        <div className="text-7xl animate-float">📦</div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>
          <p className="text-slate-600">This product doesn't exist or has been removed.</p>
        </div>
        <button
          onClick={() => navigateWithTransition(router, '/')}
          className="btn-primary px-8 py-4 shadow-brand-lg"
        >
          ← Back to Library
        </button>
      </div>
    );
  }

  const currentName = product.name[language] || product.name.ja;
  const currentDesc = product.description[language] || product.description.ja;
  const currentEffects = product.effects[language] || product.effects.ja;
  const currentSideEffects = product.sideEffects[language] || product.sideEffects.ja;
  const currentGoodFor = product.goodFor[language] || product.goodFor.ja;

  const handleSaveToLog = async () => {
    setSaving(true);
    setSaveStatus('idle');

    const timestamp = new Date().toISOString();
    const entry = {
      productId: product.id,
      productName: currentName,
      category: product.category,
      timestamp,
      points: product.pointValue ?? 0,
    };

    try {
      await db.logs.add(entry);

      void fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch((error) => {
        console.warn('Background log sync failed', error);
      });

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      setSaveStatus('success');

      setTimeout(() => {
        navigateWithTransition(router, '/');
      }, 800);
    } catch (error) {
      console.error('Error saving log:', error);
      setSaveStatus('error');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${currentName}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await db.products.delete(product.id);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      navigateWithTransition(router, '/');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
      setDeleting(false);
    }
  };

  const initials = currentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || 'P';

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-accent-50/30 to-white pb-48 animate-fade-in">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 glass-strong border-b border-white/70 backdrop-blur-2xl shadow-soft animate-slide-down">
        <div className="mx-auto flex h-18 max-w-5xl items-center gap-4 px-6">
          <button
            onClick={() => navigateWithTransition(router, '/')}
            className="group flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-bold text-slate-700 transition-all duration-300 hover:scale-105 hover:shadow-soft active:scale-95 focus-ring"
          >
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Product Hero Section with View Transition */}
      <div className="relative mx-auto mt-8 max-w-5xl px-6 animate-scale-in">
        <div
          className="relative overflow-hidden rounded-5xl glass-strong p-8 shadow-brand-lg"
          style={{ viewTransitionName: `product-image-${product.id}` } as React.CSSProperties}
        >
          {/* Decorative Background Gradient */}
          <div className="absolute inset-0 bg-gradient-mesh from-brand-100 via-accent-100 to-brand-200 opacity-30" />

          <div className="relative flex items-center justify-center aspect-[4/3] max-h-96">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-brand shadow-brand-lg">
                <span className="text-6xl font-black text-white drop-shadow-lg">{initials}</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">Product Preview</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-4xl space-y-6 px-6">
        {/* Language Selector */}
        <div className="flex items-center justify-center gap-2.5 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {LANGUAGE_FLAGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`group flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all duration-300 focus-ring ${
                language === lang.code
                  ? 'bg-gradient-brand text-white shadow-brand scale-110'
                  : 'glass text-slate-700 hover:bg-white hover:scale-105 active:scale-95 shadow-soft'
              }`}
              aria-label={`Switch to ${lang.label}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>

        {/* Product Info Card */}
        <div className="card rounded-5xl p-8 shadow-brand-lg animate-scale-in" style={{ animationDelay: '0.15s' }}>
          <div className="space-y-4">
            <h1
              className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight"
              style={{ viewTransitionName: `product-name-${product.id}` } as React.CSSProperties}
            >
              {currentName}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`badge px-5 py-2 text-sm ${
                product.category === 'health'
                  ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border border-pink-200'
              }`}>
                {product.category === 'health' ? '💊 Health' : '💄 Cosmetic'}
              </span>

              {product.pointValue !== undefined && (
                <span className="badge px-5 py-2 text-sm bg-gradient-to-r from-brand-100 to-accent-100 text-brand-700 border border-brand-200">
                  ⭐ {product.pointValue} Points
                </span>
              )}
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {currentDesc && (
          <section className="card rounded-4xl p-7 shadow-soft-lg animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand">
                <span className="text-lg">📝</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Description</h2>
            </div>
            <p className="text-base leading-relaxed text-slate-700 whitespace-pre-line">{currentDesc}</p>
          </section>
        )}

        {/* Effects */}
        {currentEffects && (
          <section className="card rounded-4xl p-7 shadow-soft-lg animate-scale-in" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 shadow-soft">
                <span className="text-lg">✨</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Effects</h2>
            </div>
            <p className="text-base leading-relaxed text-slate-700 whitespace-pre-line">{currentEffects}</p>
          </section>
        )}

        {/* Side Effects */}
        {currentSideEffects && (
          <section className="card rounded-4xl p-7 shadow-soft-lg animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 shadow-soft">
                <span className="text-lg">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Side Effects</h2>
            </div>
            <p className="text-base leading-relaxed text-slate-700 whitespace-pre-line">{currentSideEffects}</p>
          </section>
        )}

        {/* Good For */}
        {currentGoodFor && (
          <section className="card rounded-4xl p-7 shadow-soft-lg animate-scale-in" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-soft">
                <span className="text-lg">💡</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Good For</h2>
            </div>
            <p className="text-base leading-relaxed text-slate-700 whitespace-pre-line">{currentGoodFor}</p>
          </section>
        )}
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="fixed inset-x-0 bottom-0 z-30 glass-strong border-t border-white/70 p-6 shadow-brand-lg backdrop-blur-2xl animate-slide-up">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Success/Error Message */}
          {saveStatus !== 'idle' && (
            <div className={`card rounded-3xl px-5 py-4 text-center animate-slide-down ${
              saveStatus === 'success'
                ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
            }`}>
              <p className={`text-sm font-bold ${
                saveStatus === 'success' ? 'text-emerald-800' : 'text-red-800'
              }`}>
                {saveStatus === 'success'
                  ? '✅ Saved to log successfully!'
                  : '❌ Failed to save. Please try again.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => {/* TODO: Navigate to edit page */}}
              className="btn-secondary py-4 text-base shadow-soft-lg"
              aria-label="Edit product details"
            >
              <span className="inline-flex items-center gap-2">
                <span className="text-lg">✏️</span>
                <span>Edit Product</span>
              </span>
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full px-6 py-4 text-base font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-accent transition-all duration-300 hover:shadow-accent hover:scale-105 active:scale-95 disabled:opacity-60 focus-ring"
              aria-label="Delete product permanently"
            >
              {deleting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block animate-spin">↻</span>
                  Deleting...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="text-lg">🗑️</span>
                  Delete
                </span>
              )}
            </button>

            <button
              onClick={handleSaveToLog}
              disabled={saving}
              className="btn-primary py-4 text-base shadow-brand-lg"
              aria-label="Save product to usage log"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block animate-spin">↻</span>
                  Saving...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Add to Log
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
