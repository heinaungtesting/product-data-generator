'use client';

import Image from 'next/image';
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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        const image = await getProductImage(productId);

        if (mounted) {
          if (image?.thumbnailData) {
            setThumbnailSrc(image.thumbnailData);
            setHasError(false);
          } else {
            setThumbnailSrc('/images/placeholder.png');
          }
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
      <Image
        src={thumbnailSrc}
        alt={productName}
        fill
        unoptimized={!thumbnailSrc.startsWith('/')}
        sizes="(max-width: 768px) 50vw, 220px"
        className="object-cover transition duration-500 group-hover:scale-105"
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setThumbnailSrc('/images/placeholder.png');
          }
        }}
      />
      {loading && thumbnailSrc === '/images/placeholder.png' && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
    </div>
  );
}
