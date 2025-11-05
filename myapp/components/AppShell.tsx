'use client';

import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

interface AppShellProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export default function AppShell({ children, showBottomNav = true }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-white" />
        <div className="absolute inset-x-0 top-[-150px] h-[300px] bg-gradient-to-r from-sky-200/50 via-white to-indigo-200/40 blur-3xl" />
      </div>

      <div className="flex min-h-screen flex-col">
        <TopBar />

        <main className="flex-1 overflow-auto pb-safe">
          <div className="mx-auto w-full max-w-[430px] px-4 pb-10 pt-4">
            {children}
          </div>
        </main>

        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
