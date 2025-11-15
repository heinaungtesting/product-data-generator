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

  const totalEntries = logs?.length ?? 0;
  const totalPoints = logs?.reduce((sum, entry) => sum + (entry.points || 0), 0) ?? 0;

  return (
    <AppShell>
      <div className="space-y-7">
        {/* Stats Header */}
        <section className="grid grid-cols-2 gap-4 animate-scale-in">
          <div className="card rounded-4xl p-6 shadow-soft-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{totalEntries}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">Total Entries</p>
          </div>

          <div className="card rounded-4xl p-6 shadow-soft-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 shadow-soft">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{totalPoints}</p>
            <p className="text-sm font-semibold text-slate-500 mt-1">Total Points</p>
          </div>
        </section>

        {/* Log Entries */}
        {!groupedLogs ? (
          <LogSkeleton />
        ) : groupedLogs.length === 0 ? (
          <div className="card rounded-5xl p-12 text-center border-2 border-dashed border-brand-200 bg-gradient-brand-subtle shadow-soft-lg animate-scale-in">
            <div className="mb-6 text-7xl animate-float">📝</div>
            <h2 className="text-2xl font-bold text-slate-900">No log entries yet</h2>
            <p className="mt-4 text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              Save products from the home page to start building your history and tracking your usage.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedLogs.map((group, index) => (
              <LogCard
                key={group.latestEntry.id ?? group.latestEntry.timestamp}
                entry={group.latestEntry}
                count={group.count}
                totalPoints={group.totalPoints}
                entries={group.entries}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LogCard({
  entry,
  count,
  totalPoints,
  entries,
  index,
}: {
  entry: LogEntry;
  count: number;
  totalPoints: number;
  entries: LogEntry[];
  index: number;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async () => {
    if (!entries.length) return;

    const confirmMessage = count > 1
      ? `Delete all ${count} entries of "${entry.productName}"? This cannot be undone.`
      : `Delete "${entry.productName}"? This cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const idsToDelete = entries.map(e => e.id).filter((id): id is number => id !== undefined);
      await db.logs.bulkDelete(idsToDelete);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const displayDate = format(parseISO(entry.timestamp), 'MMM d, yyyy · h:mm a');

  return (
    <article
      className="card-interactive rounded-4xl p-6 shadow-soft-lg animate-scale-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Product Name */}
          <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
            {entry.productName || 'Unknown product'}
          </h3>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{displayDate}</span>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {count > 1 && (
              <span className="badge px-3 py-1.5 bg-gradient-to-r from-brand-100 to-accent-100 text-brand-700 border border-brand-200 text-xs">
                ×{count} Uses
              </span>
            )}

            <span className="badge px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200 text-xs">
              ⭐ {totalPoints} Points
            </span>

            {entry.category && (
              <span className={`badge px-3 py-1.5 text-xs ${
                entry.category === 'health'
                  ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border border-pink-200'
              }`}>
                {entry.category === 'health' ? '💊 Health' : '💄 Cosmetic'}
              </span>
            )}
          </div>

          {/* Expand/Collapse for Multiple Entries */}
          {count > 1 && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
              >
                <span>{isExpanded ? 'Hide' : 'Show'} all {count} entries</span>
                <svg
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-2 pl-4 border-l-2 border-brand-200 animate-slide-down">
                  {entries
                    .slice()
                    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                    .map((e, idx) => (
                      <div key={e.id ?? e.timestamp} className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <span>{format(parseISO(e.timestamp), 'MMM d, yyyy · h:mm a')}</span>
                        <span className="text-brand-600 font-semibold">({e.points} pts)</span>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-shrink-0 px-4 py-2.5 rounded-full bg-transparent text-red-500 font-bold hover:bg-red-50 hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 focus-ring"
          aria-label={`Delete ${count > 1 ? `all ${count} entries of ` : ''}${entry.productName}`}
        >
          {isDeleting ? (
            <span className="inline-block animate-spin">↻</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="text-lg">🗑️</span>
              <span className="hidden sm:inline">Delete</span>
            </span>
          )}
        </button>
      </div>
    </article>
  );
}

function LogSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="card rounded-4xl p-6 animate-pulse"
        >
          <div className="space-y-3">
            <div className="h-6 w-3/5 rounded-full skeleton" />
            <div className="h-4 w-2/5 rounded-full skeleton" />
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-full skeleton" />
              <div className="h-7 w-24 rounded-full skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
