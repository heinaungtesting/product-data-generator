'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import AppShell from '@/components/AppShell';
import { useLiveQuery } from '@/lib/hooks';
import { db, type LogEntry } from '@/lib/db';

export default function LogPage() {
  const logs = useLiveQuery(async () => {
    const items = await db.logs.orderBy('timestamp').reverse().toArray();
    return items;
  }, []);

  // Group logs by product ID and calculate counts
  const groupedLogs = useMemo(() => {
    if (!logs) return null;

    const groups = new Map<string, { entries: LogEntry[]; count: number; totalPoints: number; latestEntry: LogEntry }>();

    logs.forEach((entry) => {
      const key = entry.productId || 'unknown';
      const existing = groups.get(key);

      if (existing) {
        existing.entries.push(entry);
        existing.count++;
        existing.totalPoints += entry.points || 0;
        if (entry.timestamp > existing.latestEntry.timestamp) {
          existing.latestEntry = entry;
        }
      } else {
        groups.set(key, {
          entries: [entry],
          count: 1,
          totalPoints: entry.points || 0,
          latestEntry: entry,
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) =>
      b.latestEntry.timestamp.localeCompare(a.latestEntry.timestamp)
    );
  }, [logs]);

  return (
    <AppShell>
      <div className="space-y-6">
        {!groupedLogs ? (
          <LogSkeleton />
        ) : groupedLogs.length === 0 ? (
          <div className="rounded-[32px] border-2 border-dashed border-indigo-200 bg-white/70 p-10 text-center shadow-inner">
            <h2 className="text-lg font-semibold text-slate-800">No log entries yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Save products from the home page to start building your history.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {groupedLogs.map((group) => (
              <LogCard
                key={group.latestEntry.id ?? group.latestEntry.timestamp}
                entry={group.latestEntry}
                count={group.count}
                totalPoints={group.totalPoints}
                entries={group.entries}
              />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function LogCard({
  entry,
  count,
  totalPoints,
  entries
}: {
  entry: LogEntry;
  count: number;
  totalPoints: number;
  entries: LogEntry[];
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!entries.length) return;

    // Confirm deletion - different message for single vs multiple entries
    const confirmMessage = count > 1
      ? `Delete all ${count} entries of "${entry.productName}"? This cannot be undone.`
      : `Delete "${entry.productName}"? This cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      // Delete all entries for this product
      const idsToDelete = entries.map(e => e.id).filter((id): id is number => id !== undefined);
      await db.logs.bulkDelete(idsToDelete);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayDate = format(parseISO(entry.timestamp), 'yyyy/MM/dd, HH:mm:ss');

  return (
    <li className="rounded-[32px] bg-white/95 p-5 shadow-lg shadow-indigo-500/5 border border-white/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            {entry.productName || 'Unknown product'}
          </p>
          <p className="text-sm text-slate-500">{displayDate}</p>
          <p className="text-sm font-medium text-slate-600">
            {count > 1 ? `${totalPoints} Points (×${count})` : `${entry.points} Points`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 rounded-full bg-transparent text-red-500 font-semibold hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
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
