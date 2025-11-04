'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, type Product } from '@/lib/db';
import { useAppStore } from '@/lib/store';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useAppStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          imageUrl: null
        }
      };

      // Try to save to server
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        throw new Error('Failed to save log');
      }

      // Show success feedback
      alert('Saved to log!');
    } catch (error) {
      console.error('Error saving log:', error);

      // Queue for later if offline
      const queue = JSON.parse(localStorage.getItem('log.queue') || '[]');
      queue.push({
        id: product.id,
        timestamp: new Date().toISOString(),
        points: product.pointValue || 1,
        snapshot: {
          name: product.name,
          imageUrl: null
        }
      });
      localStorage.setItem('log.queue', JSON.stringify(queue));

      alert('Saved offline. Will sync later.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-600 font-medium">Product not found</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  // Helper to split text into bullets
  const toBullets = (text?: string) => {
    if (!text) return [];
    return text.split('\n').map(s => s.trim()).filter(Boolean);
  };

  const currentName = product.name[language] || product.name.ja;
  const currentDesc = product.description[language] || product.description.ja;
  const currentEffects = product.effects[language] || product.effects.ja;
  const currentSideEffects = product.sideEffects[language] || product.sideEffects.ja;
  const currentGoodFor = product.goodFor[language] || product.goodFor.ja;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-4 text-gray-700 hover:text-gray-900 transition-colors min-h-[44px]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Hero Image */}
      <div className="aspect-square bg-gray-200 relative">
        <img
          src="/images/placeholder.png"
          alt={currentName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder.png';
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentName}
          </h1>
          {product.pointValue && (
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {product.pointValue} points
            </p>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {currentDesc}
          </p>
        </div>

        {/* Effects */}
        {currentEffects && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Effects</h2>
            <ul className="space-y-2">
              {toBullets(currentEffects).map((effect, i) => (
                <li key={i} className="flex gap-2 text-gray-700">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Side Effects */}
        {currentSideEffects && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Side Effects</h2>
            <ul className="space-y-2">
              {toBullets(currentSideEffects).map((effect, i) => (
                <li key={i} className="flex gap-2 text-gray-700">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Good For */}
        {currentGoodFor && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Good For</h2>
            <ul className="space-y-2">
              {toBullets(currentGoodFor).map((item, i) => (
                <li key={i} className="flex gap-2 text-gray-700">
                  <span className="text-green-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer - Save to Log */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSaveToLog}
            disabled={saving}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
          >
            {saving ? 'Saving...' : 'Save to Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
