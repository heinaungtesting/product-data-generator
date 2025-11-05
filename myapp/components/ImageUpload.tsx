'use client';

import { useState, useRef, useCallback } from 'react';
import { processImage, validateImageFile, formatBytes } from '@/lib/imageUtils';
import { saveProductImage, deleteProductImage, type ProductImage } from '@/lib/db';

interface ImageUploadProps {
  productId: string;
  currentImage?: ProductImage;
  onImageChange?: () => void;
}

export default function ImageUpload({ productId, currentImage, onImageChange }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setLoading(false);
        return;
      }

      // Process image (resize, compress, thumbnail)
      const processed = await processImage(file);

      // Warn if still large after compression
      if (processed.sizeBytes > 500 * 1024) {
        console.warn(`Image size: ${formatBytes(processed.sizeBytes)}`);
      }

      // Save to IndexedDB
      await saveProductImage(
        productId,
        processed.imageData,
        processed.thumbnailData,
        processed.mimeType,
        processed.sizeBytes
      );

      // Trigger haptic feedback on iOS
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Notify parent
      onImageChange?.();

      setLoading(false);
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to process image');
      setLoading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [productId, onImageChange]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Delete this photo?')) return;

    setLoading(true);
    try {
      await deleteProductImage(productId);

      // Trigger haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }

      onImageChange?.();
      setLoading(false);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
      setLoading(false);
    }
  }, [productId, onImageChange]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePreviewClick = useCallback(() => {
    if (currentImage) {
      setShowPreview(true);
    }
  }, [currentImage]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  return (
    <div className="relative w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload product photo"
      />

      {/* Image display or empty state */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
        {currentImage ? (
          // Show current image
          <div className="relative w-full h-full group">
            <img
              src={currentImage.imageData}
              alt="Product photo"
              className="w-full h-full object-cover cursor-pointer"
              loading="lazy"
              decoding="async"
              onClick={handlePreviewClick}
            />

            {/* Overlay with edit/delete buttons */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 flex items-center justify-center gap-4">
              <button
                onClick={handleClick}
                disabled={loading}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Replace photo"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                onClick={handleDelete}
                disabled={loading}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 bg-white rounded-full shadow-lg hover:bg-red-50 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Delete photo"
              >
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* File size badge */}
            {currentImage.sizeBytes && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                {formatBytes(currentImage.sizeBytes)}
              </div>
            )}
          </div>
        ) : (
          // Empty state - prompt to add photo
          <button
            onClick={handleClick}
            disabled={loading}
            className="w-full h-full flex flex-col items-center justify-center gap-3 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50"
            aria-label="Add product photo"
          >
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-600 font-medium">Add Product Photo</span>
            <span className="text-gray-500 text-sm">Tap to take photo or choose from gallery</span>
          </button>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Full-screen preview modal */}
      {showPreview && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={handleClosePreview}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={currentImage.imageData}
              alt="Product photo"
              className="max-w-full max-h-full object-contain"
              style={{ touchAction: 'pinch-zoom' }}
            />

            {/* Close button */}
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 active:scale-95 min-w-[44px] min-h-[44px]"
              aria-label="Close preview"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
