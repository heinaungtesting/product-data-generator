'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import AppShell from '@/components/AppShell';
import { useLiveQuery } from '@/lib/hooks';
import { db, type LogEntry } from '@/lib/db';

type DayCell = {
  date: Date;
  formatted: string;
  isCurrentMonth: boolean;
  hasEntries: boolean;
};

export default function CalendarPage() {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const logs = useLiveQuery(async () => {
    const items = await db.logs.orderBy('timestamp').toArray();
    return items;
  }, []);

  const logsByDay = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    if (!logs) return map;

    logs.forEach((entry) => {
      const dayKey = entry.timestamp.slice(0, 10);
      const bucket = map.get(dayKey) ?? [];
      bucket.push(entry);
      map.set(dayKey, bucket);
    });

    return map;
  }, [logs]);

  const calendarDays = useMemo(() => generateCalendar(monthCursor, logsByDay), [monthCursor, logsByDay]);

  const selectedDayKey = format(selectedDate, 'yyyy-MM-dd');
  const entriesForSelectedDay = logsByDay.get(selectedDayKey) ?? [];

  const totalEntries = logs?.length ?? 0;

  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500">
            {totalEntries} saved {totalEntries === 1 ? 'entry' : 'entries'} across your history.
          </p>
        </header>

        <section className="rounded-[32px] bg-white/80 p-5 shadow-xl shadow-[#b6a8ff22] backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede7ff] text-[#5b4bc4] transition hover:bg-[#e3ddff]"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900">
                {format(monthCursor, 'LLLL yyyy')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede7ff] text-[#5b4bc4] transition hover:bg-[#e3ddff]"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const label = format(day.date, 'd');

              return (
                <button
                  key={day.formatted}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`relative h-12 rounded-2xl text-sm font-semibold transition ${
                    isSelected
                      ? 'bg-[#5b4bc4] text-white shadow-md shadow-[#5b4bc450]'
                      : day.isCurrentMonth
                      ? 'bg-white text-slate-600 hover:bg-[#f1ecff]'
                      : 'bg-transparent text-slate-400'
                  }`}
                >
                  {label}
                  {day.hasEntries && !isSelected ? (
                    <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#5b4bc4]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>

          {entriesForSelectedDay.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#dcd4ff] bg-white/70 p-8 text-center text-sm text-slate-500 shadow-inner shadow-[#b6a8ff22]">
              Nothing saved on this day yet.
            </div>
          ) : (
            <div className="space-y-4">
              {entriesForSelectedDay
                .slice()
                .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
                .map((entry) => (
                  <DayEntryCard key={entry.id ?? entry.timestamp} entry={entry} />
                ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function DayEntryCard({ entry }: { entry: LogEntry }) {
  const time = format(parseISO(entry.timestamp), 'HH:mm');

  return (
    <div className="rounded-[28px] bg-white/90 p-4 shadow-xl shadow-[#b6a8ff22]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{entry.productName || 'Unknown product'}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
        <span className="rounded-full bg-[#ede7ff] px-3 py-1 text-xs font-medium text-[#5b4bc4]">
          {entry.points} Points · {entry.category}
        </span>
      </div>
    </div>
  );
}

function generateCalendar(month: Date, logsByDay: Map<string, LogEntry[]>): DayCell[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });

  const days: DayCell[] = [];
  let cursor = start;

  while (cursor <= end) {
    const formatted = format(cursor, 'yyyy-MM-dd');
    days.push({
      date: cursor,
      formatted,
      isCurrentMonth: isSameMonth(cursor, month),
      hasEntries: logsByDay.has(formatted),
    });
    cursor = addDays(cursor, 1);
  }

  return days;
}
