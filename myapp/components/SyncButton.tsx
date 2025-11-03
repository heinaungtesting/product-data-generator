'use client';

import { ReactNode } from 'react';

type SyncButtonProps = {
  isSyncing: boolean;
  onSync: () => Promise<void> | void;
  children: ReactNode;
};

export default function SyncButton({ isSyncing, onSync, children }: SyncButtonProps) {
  return (
    <button
      type="button"
      onClick={onSync}
      className="inline-flex min-h-11 min-w-[120px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:opacity-70"
      disabled={isSyncing}
    >
      {isSyncing && (
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="absolute h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}
