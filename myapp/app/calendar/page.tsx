'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import AppShell from '@/components/AppShell';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@/lib/hooks';
import { db } from '@/lib/db';

type ActivityBucket = {
  total: number;
  view: number;
  edit: number;
  compare: number;
};

export default function CalendarPage() {
  const { t } = useTranslation();
  const logs = useLiveQuery(async () => db.logs.toArray(), []);

  const activity = useMemo(() => {
    if (!logs) return [];

    const buckets = new Map<string, ActivityBucket>();

    logs.forEach((entry) => {
      const day = entry.timestamp.slice(0, 10);
      const bucket = buckets.get(day) ?? { total: 0, view: 0, edit: 0, compare: 0 };
      bucket.total += 1;
      bucket[entry.action] += 1;
      buckets.set(day, bucket);
    });

    return Array.from(buckets.entries())
      .map(([day, bucket]) => ({ day, bucket }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [logs]);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-fg">{t('calendar')}</h1>
          <p className="text-sm text-fg/60">
            {activity.reduce((total, item) => total + item.bucket.total, 0)} {t('log')}
          </p>
        </header>

        {!activity.length && (
          <p className="rounded-2xl border border-dashed border-fg/10 bg-fg/5 p-6 text-center text-sm text-fg/60">
            {t('noData')}
          </p>
        )}

        {activity.length > 0 && (
          <div className="space-y-3">
            {activity.map(({ day, bucket }) => (
              <div
                key={day}
                className="rounded-2xl border border-fg/10 bg-bg/80 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-fg">
                    {format(parseISO(`${day}T00:00:00Z`), 'PPPP')}
                  </h2>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {bucket.total} {t('log')}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-3 text-xs text-fg/70">
                  <Stat label={t('viewLog')} value={bucket.view} />
                  <Stat label={t('editLog')} value={bucket.edit} />
                  <Stat label={t('compare')} value={bucket.compare} />
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-fg/10 bg-fg/5 px-3 py-2 text-center">
      <dt className="text-[11px] uppercase tracking-wide text-fg/50">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-fg">{value}</dd>
    </div>
  );
}
