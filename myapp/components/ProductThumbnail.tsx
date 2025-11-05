'use client';

import { useEffect, useState } from 'react';
import { getProductImage } from '@/lib/db';

interface ProductThumbnailProps {
  productId: string;
  productName: string;
  className?: string;
}

export default function ProductThumbnail({ productId, productName, className = '' }: ProductThumbnailProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string>('/images/placeholder.png');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        const image = await getProductImage(productId);

        if (mounted && image?.thumbnailData) {
          setThumbnailSrc(image.thumbnailData);
        }
      } catch (error) {
        console.error('Error loading thumbnail:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      mounted = false;
    };
  }, [productId]);

  return (
    <div className={`relative ${className}`}>
      <img
        src={thumbnailSrc}
        alt={productName}
        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = '/images/placeholder.png';
        }}
      />
      {loading && thumbnailSrc === '/images/placeholder.png' && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
    </div>
  );
}
