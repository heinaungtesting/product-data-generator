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
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
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
      <div className="space-y-6">
        <section className="rounded-[32px] bg-white/90 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-lg border border-white/50">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-slate-900">
                {format(monthCursor, 'MMMM yyyy')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const label = format(day.date, 'd');

              return (
                <button
                  key={day.formatted}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`relative h-14 rounded-2xl text-lg font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-105'
                      : day.isCurrentMonth
                      ? 'bg-white text-slate-700 hover:bg-indigo-50 hover:scale-105 shadow-sm'
                      : 'bg-transparent text-slate-300'
                  }`}
                >
                  {label}
                  {day.hasEntries && !isSelected ? (
                    <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-indigo-600" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>

          {entriesForSelectedDay.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-indigo-200 bg-white/70 p-10 text-center shadow-inner">
              <p className="text-slate-500 font-medium">Nothing saved on this day yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
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
  const time = format(parseISO(entry.timestamp), 'HH:mm:ss');
  const date = format(parseISO(entry.timestamp), 'yyyy/MM/dd');

  return (
    <div className="rounded-[28px] bg-white/95 p-5 shadow-lg shadow-indigo-500/5 border border-white/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1.5">
          <p className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            {entry.productName || 'Unknown product'}
          </p>
          <p className="text-sm text-slate-500">
            {date}, {time}
          </p>
          <p className="text-sm font-medium text-slate-600">
            {entry.points} Points
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-full bg-transparent text-red-500 font-semibold hover:bg-red-50 transition-all active:scale-95"
        >
          Delete
        </button>
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
