'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { href: '/', translationKey: 'home', fallback: 'Home', icon: '🏠' },
  { href: '/log', translationKey: 'log', fallback: 'Log', icon: '📋' },
  { href: '/calendar', translationKey: 'calendar', fallback: 'Calendar', icon: '📅' },
  { href: '/settings', translationKey: 'settings', fallback: 'Settings', icon: '⚙️' },
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
    <header className="relative z-40 -mx-5 px-5 animate-slide-down">
      <nav className="relative overflow-hidden rounded-[2rem] glass-strong p-2 shadow-brand-lg">
        {/* Gradient Highlight Bar */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-accent-500/5 to-brand-500/5 opacity-50" />

        <ul className="relative grid grid-cols-4 gap-1.5">
          {NAV_ITEMS.map((item) => {
            const href = item.href === '/' ? '/' : item.href;
            const isActive = currentPath === href;

            return (
              <li key={item.href}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex flex-col items-center justify-center gap-1 rounded-[1.25rem] px-3 py-3 transition-all duration-300 focus-ring ${
                    isActive
                      ? 'bg-gradient-brand shadow-brand text-white scale-105'
                      : 'text-slate-600 hover:bg-white/60 hover:text-brand-600 hover:scale-105 active:scale-95'
                  }`}
                >
                  {/* Icon with Glow Effect */}
                  <span className={`text-xl transition-all duration-300 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110'
                  }`}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span className={`text-2xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                  }`}>
                    {t(item.translationKey, { defaultValue: item.fallback })}
                  </span>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white shadow-glow animate-glow-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
