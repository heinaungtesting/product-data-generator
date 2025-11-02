'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

interface SearchBarProps {
  onClose: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useAppStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  return (
    <div className="flex items-center gap-2">
      <input
        type="search"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search products..."
        autoFocus
        className="flex-1 h-9 px-3 bg-transparent border-none outline-none text-fg placeholder:text-fg/40"
      />
      <button
        onClick={onClose}
        className="text-fg/60 hover:text-fg"
        aria-label="Close search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
