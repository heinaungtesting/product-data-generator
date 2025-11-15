'use client';

import { ReactNode } from 'react';
import TopBar from './TopBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-green-50 to-pink-50/30">
      {/* Subtle Background Pattern */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />
      </div>

      {/* Main Content Container */}
      <div className="mx-auto flex min-h-screen w-full max-w-[500px] flex-col px-5 pb-12 pt-6">
        <TopBar />
        <main className="mt-8 flex-1 pb-safe animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
