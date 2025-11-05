'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';

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
    <header className="relative z-40">
      <div className="flex items-center justify-between gap-3 rounded-3xl bg-white/80 px-5 py-3 shadow-lg shadow-[#9f8efa1a] backdrop-blur-md">
        <div className="font-semibold text-slate-900">
          MyApp
        </div>
        <LanguageToggle />
      </div>

      <nav className="mt-4 rounded-full bg-white/70 p-1 shadow-md shadow-[#9f8efa29] backdrop-blur-sm">
        <ul className="grid grid-cols-4 gap-1 text-sm font-semibold text-slate-500">
          {NAV_ITEMS.map((item) => {
            const href = item.href === '/' ? '/' : item.href;
            const isActive = currentPath === href;

            return (
              <li key={item.href}>
                <Link
                  href={href}
                  className={`flex items-center justify-center rounded-full px-3 py-2 transition ${
                    isActive
                      ? 'bg-[#a78bfa] text-white shadow-sm shadow-[#a78bfa80]'
                      : 'hover:bg-[#ede7ff] hover:text-[#5b4bc4]'
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
