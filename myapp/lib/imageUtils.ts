/**
 * Client-side image processing utilities
 * Handles resize, compress, thumbnail creation - all offline
 */

export interface ProcessedImage {
  imageData: string; // base64 with data URI
  thumbnailData: string; // base64 with data URI
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Convert file to base64 data URI
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from base64
 */
export function getImageDimensions(base64: string): Promise<{width: number; height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * Resize image to fit within max dimensions
 */
export async function resizeImage(
  base64: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG for better compression
      const resized = canvas.toDataURL('image/jpeg', quality);
      resolve(resized);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

/**
 * Create thumbnail from image
 */
export async function createThumbnail(
  base64: string,
  size: number = 100,
  quality: number = 0.7
): Promise<string> {
  return resizeImage(base64, size, size, quality);
}

/**
 * Get size of base64 string in bytes
 */
export function getBase64Size(base64: string): number {
  // Remove data URI prefix
  const base64String = base64.split(',')[1] || base64;

  // Calculate size (base64 is ~33% larger than binary)
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
  return Math.floor((base64String.length * 3) / 4) - padding;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 10) / 10} ${sizes[i]}`;
}

/**
 * Compress image if it exceeds target size
 */
export async function compressImageIfNeeded(
  base64: string,
  targetSizeKB: number = 500,
  minQuality: number = 0.5
): Promise<string> {
  let currentSize = getBase64Size(base64);

  // Already small enough
  if (currentSize <= targetSizeKB * 1024) {
    return base64;
  }

  let quality = 0.8;
  let compressed = base64;

  // Try progressively lower quality
  while (currentSize > targetSizeKB * 1024 && quality >= minQuality) {
    compressed = await resizeImage(base64, 800, 800, quality);
    currentSize = getBase64Size(compressed);
    quality -= 0.1;
  }

  return compressed;
}

/**
 * Process image file: resize, compress, create thumbnail
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  // Convert to base64
  const base64 = await fileToBase64(file);

  // Get original dimensions
  const { width, height } = await getImageDimensions(base64);

  // Resize to max 800x800 if needed
  const resized = await resizeImage(base64, 800, 800, 0.8);

  // Compress if > 500KB
  const compressed = await compressImageIfNeeded(resized, 500, 0.5);

  // Create 100x100 thumbnail
  const thumbnail = await createThumbnail(compressed, 100, 0.7);

  // Calculate final size
  const sizeBytes = getBase64Size(compressed);

  return {
    imageData: compressed,
    thumbnailData: thumbnail,
    mimeType: 'image/jpeg',
    sizeBytes,
    width,
    height,
  };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 10MB before processing)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Image too large (max 10MB)' };
  }

  // Check file types (support common formats)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return { valid: false, error: `Unsupported format (${file.type})` };
  }

  return { valid: true };
}

/**
 * Check if storage quota is exceeded
 */
export async function checkStorageQuota(): Promise<{
  available: boolean;
  usedBytes: number;
  totalBytes: number;
  percentUsed: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usedBytes = estimate.usage || 0;
    const totalBytes = estimate.quota || 0;
    const percentUsed = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    return {
      available: percentUsed < 90, // Warn at 90%
      usedBytes,
      totalBytes,
      percentUsed,
    };
  }

  // Fallback if API not available
  return {
    available: true,
    usedBytes: 0,
    totalBytes: 0,
    percentUsed: 0,
  };
}
