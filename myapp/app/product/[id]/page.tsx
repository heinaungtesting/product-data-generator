'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, getProductImage, type Product, type ProductImage } from '@/lib/db';
import { useAppStore, type Language } from '@/lib/store';
import ImageUpload from '@/components/ImageUpload';

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
  const [productImage, setProductImage] = useState<ProductImage | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const loadProductImage = useCallback(async (productId: string) => {
    try {
      const image = await getProductImage(productId);
      setProductImage(image);
    } catch (error) {
      console.error('Error loading product image:', error);
    }
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      const id = params.id as string;
      try {
        const dbProduct = await db.products.get(id);
        setProduct(dbProduct || null);

        if (dbProduct) {
          await loadProductImage(dbProduct.id);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      }
      setLoading(false);
    };

    loadProduct();
  }, [params.id, loadProductImage]);

  useEffect(() => {
    setSaveStatus('idle');
  }, [product?.id]);

  const handleImageChange = useCallback(() => {
    if (product) {
      loadProductImage(product.id);
    }
  }, [product, loadProductImage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-indigo-50 via-white to-white p-4 text-center">
        <p className="text-lg font-semibold text-slate-600">Product not found</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-full bg-indigo-600 px-6 py-3 text-white shadow-lg shadow-indigo-400/50 transition hover:-translate-y-0.5"
        >
          Back to library
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

      // Fire-and-forget: send to API if configured
      void fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch((error) => {
        console.warn('Background log sync failed', error);
      });

      setSaveStatus('success');

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving log:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${currentName}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await db.products.delete(product.id);

      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Navigate back to home
      router.push('/');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-48">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Product Image Upload */}
      <div className="relative mx-auto mt-6 max-w-5xl px-4">
        <ImageUpload
          productId={product.id}
          currentImage={productImage}
          onImageChange={handleImageChange}
        />
      </div>

      <div className="mx-auto mt-6 max-w-4xl space-y-6 px-4">
        {/* Language Selector */}
        <div className="flex items-center justify-center gap-2">
          {LANGUAGE_FLAGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
                language === lang.code
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'bg-white/80 text-slate-600 border-2 border-slate-200 hover:border-indigo-200'
              }`}
              aria-label={`Switch to ${lang.label}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>

        {/* Product Info Card */}
        <div className="rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-lg shadow-indigo-500/5">
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
            {currentName}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700">
              {product.category}
            </span>
            {product.tags?.length ? (
              product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))
            ) : null}
          </div>
        </div>

        {/* Description */}
        {currentDesc && (
          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-lg shadow-indigo-500/5">
            <h2 className="text-lg font-bold text-slate-900">Description</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{currentDesc}</p>
          </section>
        )}

        {/* Effects */}
        {currentEffects && (
          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-lg shadow-indigo-500/5">
            <h2 className="text-lg font-bold text-slate-900">Effects</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{currentEffects}</p>
          </section>
        )}

        {/* Side Effects */}
        {currentSideEffects && (
          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-lg shadow-indigo-500/5">
            <h2 className="text-lg font-bold text-slate-900">Side Effects</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{currentSideEffects}</p>
          </section>
        )}

        {/* Good For */}
        {currentGoodFor && (
          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-lg shadow-indigo-500/5">
            <h2 className="text-lg font-bold text-slate-900">Good For</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{currentGoodFor}</p>
          </section>
        )}
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/95 p-4 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl space-y-3">
          {/* Success/Error Message */}
          {saveStatus !== 'idle' && (
            <div className={`rounded-2xl px-4 py-3 text-sm font-medium text-center ${
              saveStatus === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveStatus === 'success'
                ? '✅ Saved to log successfully!'
                : '❌ Failed to save. Please try again.'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => {/* TODO: Navigate to edit page */}}
              className="rounded-full bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 active:scale-95"
            >
              Edit Product
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-red-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-red-500/30 transition-all hover:bg-red-600 active:scale-95 disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>

            <button
              onClick={handleSaveToLog}
              disabled={saving}
              className="rounded-full bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Add to log'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
