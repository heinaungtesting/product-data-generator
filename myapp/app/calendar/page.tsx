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
  isToday,
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
  isToday: boolean;
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
  const selectedDayPoints = entriesForSelectedDay.reduce((sum, e) => sum + (e.points || 0), 0);

  return (
    <AppShell>
      <div className="space-y-7">
        {/* Calendar Card */}
        <section className="card rounded-5xl p-6 shadow-brand-lg animate-scale-in">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
              className="group flex h-12 w-12 items-center justify-center rounded-2xl glass transition-all duration-300 hover:bg-brand-50 hover:scale-110 active:scale-95 focus-ring"
              aria-label={`Go to previous month (${format(addMonths(monthCursor, -1), 'MMMM yyyy')})`}
            >
              <svg className="h-6 w-6 text-brand-600 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center flex-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {format(monthCursor, 'MMMM yyyy')}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
              className="group flex h-12 w-12 items-center justify-center rounded-2xl glass transition-all duration-300 hover:bg-brand-50 hover:scale-110 active:scale-95 focus-ring"
              aria-label={`Go to next month (${format(addMonths(monthCursor, 1), 'MMMM yyyy')})`}
            >
              <svg className="h-6 w-6 text-brand-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const label = format(day.date, 'd');

              return (
                <button
                  key={day.formatted}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`group relative h-14 rounded-2xl text-base font-bold transition-all duration-300 focus-ring ${
                    isSelected
                      ? 'bg-gradient-brand text-white shadow-brand scale-110 z-10'
                      : day.isToday
                      ? 'bg-accent-100 text-accent-700 border-2 border-accent-300 hover:scale-110 shadow-soft'
                      : day.isCurrentMonth
                      ? 'bg-white text-slate-700 hover:bg-brand-50 hover:scale-110 shadow-soft hover:shadow-brand'
                      : 'bg-transparent text-slate-300 hover:text-slate-400'
                  }`}
                  aria-label={`Select ${format(day.date, 'MMMM d, yyyy')}`}
                >
                  <span className={`${isSelected ? 'scale-110' : ''} transition-transform`}>{label}</span>

                  {/* Entry Indicator */}
                  {day.hasEntries && !isSelected && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                      <span className={`block h-1.5 w-1.5 rounded-full ${
                        day.isToday ? 'bg-accent-600' : 'bg-brand-600'
                      } shadow-sm`} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected Day Details */}
        <section className="space-y-5 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {/* Selected Date Header */}
          <div className="card rounded-4xl p-6 shadow-soft-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                  {entriesForSelectedDay.length === 0
                    ? 'No entries'
                    : `${entriesForSelectedDay.length} ${entriesForSelectedDay.length === 1 ? 'entry' : 'entries'}`}
                </p>
              </div>

              {selectedDayPoints > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200">
                  <span className="text-lg">⭐</span>
                  <span className="text-base font-black text-amber-700">{selectedDayPoints}</span>
                </div>
              )}
            </div>
          </div>

          {/* Entries for Selected Day */}
          {entriesForSelectedDay.length === 0 ? (
            <div className="card rounded-4xl p-10 text-center border-2 border-dashed border-brand-200 bg-gradient-brand-subtle shadow-soft">
              <div className="mb-4 text-5xl animate-float">📅</div>
              <p className="text-base font-semibold text-slate-700">Nothing saved on this day yet.</p>
              <p className="mt-2 text-sm text-slate-500">Add products from the home page to track your usage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entriesForSelectedDay
                .slice()
                .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
                .map((entry, index) => (
                  <DayEntryCard key={entry.id ?? entry.timestamp} entry={entry} index={index} />
                ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function DayEntryCard({ entry, index }: { entry: LogEntry; index: number }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!entry.id) return;
    if (!confirm(`Delete this entry? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      await db.logs.delete(entry.id);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      setIsDeleting(false);
    }
  };

  const time = format(parseISO(entry.timestamp), 'h:mm a');

  return (
    <article
      className="card-interactive rounded-4xl p-5 shadow-soft-lg animate-scale-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Product Name */}
          <h4 className="text-lg font-black text-slate-900 leading-tight tracking-tight">
            {entry.productName || 'Unknown product'}
          </h4>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{time}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="badge px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200 text-xs">
              ⭐ {entry.points} Points
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
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-shrink-0 px-4 py-2.5 rounded-full bg-transparent text-red-500 font-bold hover:bg-red-50 hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 focus-ring"
          aria-label={`Delete entry for ${entry.productName} at ${time}`}
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
      isToday: isToday(cursor),
    });
    cursor = addDays(cursor, 1);
  }

  return days;
}
