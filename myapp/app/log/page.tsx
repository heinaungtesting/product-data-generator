'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import AppShell from '@/components/AppShell';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@/lib/hooks';
import { db, type LogEntry } from '@/lib/db';

export default function LogPage() {
  const { t } = useTranslation();
  const logs = useLiveQuery(async () => {
    return db.logs.orderBy('timestamp').reverse().limit(200).toArray();
  }, []);

  const grouped = useMemo(() => {
    if (!logs) return [];
    const groups = new Map<string, LogEntry[]>();

    logs.forEach((entry) => {
      const day = entry.timestamp.slice(0, 10);
      const items = groups.get(day) ?? [];
      items.push(entry);
      groups.set(day, items);
    });

    return Array.from(groups.entries())
      .map(([day, entries]) => ({
        day,
        entries,
      }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [logs]);

  const handleClear = async () => {
    if (!logs?.length) return;
    if (!window.confirm('Clear all activity history?')) return;
    await db.logs.clear();
  };

  return (
    <AppShell>
      <div className="space-y-4 p-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-fg">{t('log')}</h1>
            <p className="text-sm text-fg/60">{logs?.length ?? 0} entries</p>
          </div>
          {logs && logs.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-fg/20 px-3 py-2 text-sm font-medium text-fg/70 hover:bg-fg/5"
            >
              {t('clearData')}
            </button>
          )}
        </header>

        {!logs?.length && (
          <p className="rounded-2xl border border-dashed border-fg/10 bg-fg/5 p-6 text-center text-sm text-fg/60">
            {t('noData')}
          </p>
        )}

        {grouped.map(({ day, entries }) => (
          <section key={day} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-fg/50">
              {format(parseISO(`${day}T00:00:00Z`), 'PPP')}
            </h2>
            <div className="space-y-2 rounded-2xl border border-fg/10 bg-fg/3 p-4">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border border-fg/10 bg-bg/80 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-fg">
                        {entry.productName}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-fg/50">
                        {entry.action}
                      </p>
                    </div>
                    <time className="text-xs text-fg/50">
                      {format(parseISO(entry.timestamp), 'p')}
                    </time>
                  </div>
                  {entry.notes && (
                    <p className="mt-3 rounded-lg bg-fg/5 px-3 py-2 text-sm text-fg/70">
                      {entry.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
