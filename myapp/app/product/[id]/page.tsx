'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, getProductImage, type Product, type ProductImage } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import ImageUpload from '@/components/ImageUpload';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useAppStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [productImage, setProductImage] = useState<ProductImage | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleImageChange = useCallback(() => {
    if (product) {
      loadProductImage(product.id);
    }
  }, [product, loadProductImage]);

  const handleSaveToLog = async () => {
    if (!product) return;

    setSaving(true);

    try {
      const logEntry = {
        id: product.id,
        timestamp: new Date().toISOString(),
        points: product.pointValue || 1,
        snapshot: {
          name: product.name,
          imageUrl: null,
        },
      };

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        throw new Error('Failed to save log');
      }

      alert('Saved to log!');
    } catch (error) {
      console.error('Error saving log:', error);
      const queue = JSON.parse(localStorage.getItem('log.queue') || '[]');
      queue.push({
        id: product.id,
        timestamp: new Date().toISOString(),
        points: product.pointValue || 1,
        snapshot: {
          name: product.name,
          imageUrl: null,
        },
      });
      localStorage.setItem('log.queue', JSON.stringify(queue));
      alert('Saved offline. Will sync later.');
    } finally {
      setSaving(false);
    }
  };

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

  const toBullets = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map((line) => line.trim()).filter(Boolean);
  };

  const currentName = product.name[language] || product.name.ja;
  const currentDesc = product.description[language] || product.description.ja;
  const currentEffects = product.effects[language] || product.effects.ja;
  const currentSideEffects = product.sideEffects[language] || product.sideEffects.ja;
  const currentGoodFor = product.goodFor[language] || product.goodFor.ja;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white pb-32">
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
          <span className="text-sm text-slate-500">
            {product.category} • {product.pointValue ?? 0} pts
          </span>
        </div>
      </div>

      <div className="relative mx-auto mt-6 max-w-5xl px-4">
        <ImageUpload
          productId={product.id}
          currentImage={productImage}
          onImageChange={handleImageChange}
        />
      </div>

      <div className="mx-auto mt-8 max-w-4xl space-y-6 px-4">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">{product.category}</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{currentName}</h1>
            </div>
            {product.pointValue && (
              <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                {product.pointValue} points
              </div>
            )}
          </div>

          <p className="mt-4 text-base leading-relaxed text-slate-600 whitespace-pre-line">{currentDesc}</p>

          {product.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {currentEffects && (
          <section className="rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-lg shadow-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Effects</h2>
            <ul className="mt-4 space-y-3">
              {toBullets(currentEffects).map((effect, index) => (
                <li key={effect + index} className="flex gap-3 text-slate-600">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {currentSideEffects && (
          <section className="rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-lg shadow-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Side effects</h2>
            <ul className="mt-4 space-y-3">
              {toBullets(currentSideEffects).map((effect, index) => (
                <li key={effect + index} className="flex gap-3 text-slate-600">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {currentGoodFor && (
          <section className="rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-lg shadow-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recommended for</h2>
            <ul className="mt-4 space-y-3">
              {toBullets(currentGoodFor).map((entry, index) => (
                <li key={entry + index} className="flex gap-3 text-slate-600">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <div className="hidden flex-1 text-sm text-slate-500 md:block">
            Save this product to your daily log so it appears across devices once synced.
          </div>
          <button
            onClick={handleSaveToLog}
            disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 px-6 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/40 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 md:flex-none md:min-w-[220px]"
          >
            {saving ? 'Saving…' : 'Save to log'}
          </button>
        </div>
      </div>
    </div>
  );
}
