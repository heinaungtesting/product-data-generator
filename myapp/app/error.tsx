'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-accent-50/30 to-white flex items-center justify-center p-6">
      <div className="card rounded-5xl p-12 text-center max-w-md shadow-brand-lg animate-scale-in">
        <div className="mb-6 text-7xl animate-float">⚠️</div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-base text-slate-600 leading-relaxed mb-2">
          We encountered an unexpected error while loading this page.
        </p>

        {error.message && (
          <p className="text-sm text-slate-500 mb-8 font-mono bg-slate-100 p-3 rounded-2xl">
            {error.message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary px-8 py-4 shadow-brand-lg"
          >
            <span className="inline-flex items-center gap-2">
              <span className="text-lg">↻</span>
              Try Again
            </span>
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="btn-secondary px-8 py-4"
          >
            <span className="inline-flex items-center gap-2">
              <span className="text-lg">🏠</span>
              Go Home
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
