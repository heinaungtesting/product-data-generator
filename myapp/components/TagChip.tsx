'use client';

interface TagChipProps {
  tag: string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export default function TagChip({ tag, size = 'md', onRemove }: TagChipProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent font-medium ${sizeClasses[size]}`}>
      {tag}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-accent/80"
          aria-label={`Remove ${tag}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
