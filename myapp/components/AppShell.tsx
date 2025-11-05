'use client';

import { ReactNode } from 'react';
import TopBar from './TopBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f0ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f9f7ff] via-[#f4f1ff] to-white" />
        <div className="absolute inset-x-0 top-[-240px] h-[400px] bg-gradient-to-r from-[#9c88ff]/30 via-white to-[#a78bfa]/25 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-280px] h-[400px] bg-gradient-to-r from-[#a855f7]/20 via-white to-[#6366f1]/20 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col px-4 pb-12 pt-6">
        <TopBar />
        <main className="mt-6 flex-1 pb-safe">{children}</main>
      </div>
    </div>
  );
}
