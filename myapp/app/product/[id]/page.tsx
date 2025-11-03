'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, type Product } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { DEMO_PRODUCTS, type SimpleProduct } from '@/lib/demo-data';

// Convert DB Product to SimpleProduct
function toSimpleProduct(p: Product): SimpleProduct {
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

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useAppStore();
  const [product, setProduct] = useState<SimpleProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const currentLang = language as keyof SimpleProduct['name'];

  useEffect(() => {
    const loadProduct = async () => {
      const id = params.id as string;

      // Check if it's a demo product
      const demoProduct = DEMO_PRODUCTS.find(p => p.id === id);
      if (demoProduct) {
        setProduct(demoProduct);
        setLoading(false);
        return;
      }

      // Try to load from DB
      try {
        const dbProduct = await db.products.get(id);
        if (dbProduct) {
          setProduct(toSimpleProduct(dbProduct));
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      }
      setLoading(false);
    };

    loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-fg/60">Product not found</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-accent text-white rounded-lg font-medium"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm border-b border-fg/10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 p-4 text-fg hover:text-accent transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Hero Image */}
      <div className="aspect-square bg-fg/5 relative overflow-hidden">
        <img
          src={product.imageUrl || '/images/placeholder.png'}
          alt={product.name[currentLang]}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder.png';
          }}
        />
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Name */}
        <div>
          <h1 className="text-3xl font-bold text-fg">
            {product.name[currentLang]}
          </h1>
          {product.price && (
            <p className="text-2xl font-bold text-accent mt-2">
              ¥{product.price.toLocaleString()}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-fg mb-2">Description</h2>
          <p className="text-fg/80 leading-relaxed">
            {product.description[currentLang]}
          </p>
        </div>
      </div>
    </div>
  );
}
