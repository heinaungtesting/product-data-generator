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
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />

      <main className="flex-1 overflow-auto pb-safe">
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}
