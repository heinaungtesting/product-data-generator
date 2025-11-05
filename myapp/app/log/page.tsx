'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import AppShell from '@/components/AppShell';
import { useLiveQuery } from '@/lib/hooks';
import { db, type LogEntry } from '@/lib/db';

export default function LogPage() {
  const logs = useLiveQuery(async () => {
    const items = await db.logs.orderBy('timestamp').reverse().toArray();
    return items;
  }, []);

  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Log</h1>
          <p className="text-sm text-slate-500">Track saved products and quickly remove entries you no longer need.</p>
        </header>

        {!logs ? (
          <LogSkeleton />
        ) : logs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#dcd4ff] bg-white/70 p-10 text-center shadow-inner shadow-[#b6a8ff22]">
            <h2 className="text-lg font-semibold text-slate-800">No log entries yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Save products from the detail page to start building your history.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {logs.map((entry) => (
              <LogCard key={entry.id ?? entry.timestamp} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function LogCard({ entry }: { entry: LogEntry }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (entry.id === undefined) return;
    setIsDeleting(true);
    try {
      await db.logs.delete(entry.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayDate = format(parseISO(entry.timestamp), 'yyyy/MM/dd, HH:mm:ss');

  return (
    <li className="rounded-[28px] bg-white/90 p-4 shadow-xl shadow-[#b6a8ff22]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#5b4bc4]">
            {entry.productName || 'Unknown product'}
          </p>
          <p className="text-xs text-slate-500">{displayDate}</p>
          <p className="text-xs text-slate-400">
            {entry.points} Points · {entry.category}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-full bg-transparent px-3 py-1 text-sm font-semibold text-red-500 transition hover:text-red-600 active:scale-[0.98] disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function LogSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[28px] bg-white/80 p-4 shadow-inner shadow-[#b6a8ff2b]"
        >
          <div className="h-4 w-3/5 rounded-full bg-[#e6deff]" />
          <div className="mt-3 h-3 w-1/2 rounded-full bg-[#f1ecff]" />
        </div>
      ))}
    </div>
  );
}
