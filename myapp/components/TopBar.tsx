'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { href: '/', translationKey: 'home', fallback: 'Home' },
  { href: '/log', translationKey: 'log', fallback: 'Log' },
  { href: '/calendar', translationKey: 'calendar', fallback: 'Calendar' },
  { href: '/settings', translationKey: 'settings', fallback: 'Settings' },
];

export default function TopBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const normalizePath = (path: string) => {
    if (path === '/') return '/';
    return path.replace(/\/+$/, '');
  };

  const currentPath = normalizePath(pathname || '/');

  return (
    <header className="relative z-40 -mx-4 px-4">
      <nav className="rounded-full bg-white/90 p-1.5 shadow-xl shadow-indigo-500/10 backdrop-blur-lg border border-white/50">
        <ul className="grid grid-cols-4 gap-0.5 text-base font-bold">
          {NAV_ITEMS.map((item) => {
            const href = item.href === '/' ? '/' : item.href;
            const isActive = currentPath === href;

            return (
              <li key={item.href}>
                <Link
                  href={href}
                  className={`flex items-center justify-center rounded-full px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-inner'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {t(item.translationKey, { defaultValue: item.fallback })}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
