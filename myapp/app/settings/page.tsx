'use client';

import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/AppShell';
import { useLiveQuery } from '@/lib/hooks';
import { useAppStore, type Theme } from '@/lib/store';
import { db } from '@/lib/db';
import { getSyncStatus } from '@/lib/sync';

interface PreferenceToggleProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
  icon: string;
}

function PreferenceToggle({ label, description, value, onChange, icon }: PreferenceToggleProps) {
  return (
    <div className="card rounded-4xl p-5 shadow-soft-lg hover-lift">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900">{label}</p>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative h-8 w-14 rounded-full transition-all duration-300 focus-ring ${
            value ? 'bg-gradient-brand shadow-brand' : 'bg-slate-200'
          }`}
          aria-pressed={value}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-soft transition-all duration-300 ${
              value ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const {
    theme,
    setTheme,
    bundleUrl,
    setBundleUrl,
    autoSyncEnabled,
    setAutoSyncEnabled,
    hapticEnabled,
    setHapticEnabled,
  } = useAppStore();

  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(bundleUrl);

  const syncStatus = useLiveQuery(() => getSyncStatus());
  const productCount = useLiveQuery(() => db.products.count());

  const handleExport = async () => {
    const data = await db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = `myapp-export-${new Date().toISOString().split('T')[0]}.json`;
    element.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await db.importData(data);
    alert('Import complete!');
  };

  const handleClearData = async () => {
    if (window.confirm('Clear all local data? This cannot be undone.')) {
      await db.clearAll();
      alert('Data cleared');
    }
  };

  return (
    <AppShell>
      <div className="space-y-7">
        {/* Header Section */}
        <section className="card rounded-5xl p-8 shadow-brand-lg animate-scale-in">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-brand shadow-brand-lg">
              <span className="text-4xl">⚙️</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-600">{t('settings')}</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">Control Center</h1>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Manage appearance, syncing, and data controls for the Product Data Generator companion app.
              </p>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4 animate-scale-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 shadow-soft">
              <span className="text-lg">🎨</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{t('appearance')}</h2>
          </div>

          <div className="card rounded-4xl p-5 shadow-soft-lg">
            <p className="text-sm text-slate-600 mb-4 font-medium">Choose how the interface adapts to your environment</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['light', 'dark', 'auto'] as Theme[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setTheme(option)}
                  className={`rounded-2xl border-2 px-5 py-4 text-sm font-bold transition-all duration-300 focus-ring ${
                    theme === option
                      ? 'border-brand-500 bg-gradient-brand-subtle text-brand-700 shadow-brand scale-105'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:scale-105 active:scale-95'
                  }`}
                >
                  <span className="block text-2xl mb-2">
                    {option === 'light' ? '☀️' : option === 'dark' ? '🌙' : '🌓'}
                  </span>
                  {t(option)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="space-y-4 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-soft">
              <span className="text-lg">💾</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{t('dataManagement')}</h2>
          </div>

          {/* Bundle URL */}
          <div className="card rounded-4xl p-6 shadow-soft-lg">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-base font-bold text-slate-900">{t('bundleUrlLabel')}</p>
                <p className="text-xs text-slate-500 mt-1">Remote source for the synced bundle</p>
              </div>
              <button
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="rounded-full glass px-4 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:scale-105 transition-all focus-ring"
                aria-label={isEditingUrl ? 'Cancel editing bundle URL' : 'Edit bundle URL'}
              >
                {isEditingUrl ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditingUrl ? (
              <div className="flex flex-col gap-3 sm:flex-row animate-slide-down">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="https://example.com/bundle.json.gz"
                  className="input-field flex-1 text-sm"
                  aria-label="Bundle URL input"
                />
                <button
                  onClick={() => {
                    setBundleUrl(urlInput);
                    setIsEditingUrl(false);
                  }}
                  className="btn-primary px-6 py-3 text-sm shadow-brand-lg"
                >
                  {t('save')}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl glass p-4">
                <p className="text-sm text-slate-600 font-mono break-all">
                  {bundleUrl || 'Not configured'}
                </p>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <PreferenceToggle
              icon="🔄"
              label={t('autoSync')}
              description="Refresh bundle once per hour when enabled"
              value={autoSyncEnabled}
              onChange={setAutoSyncEnabled}
            />

            <PreferenceToggle
              icon="📳"
              label={t('hapticFeedback')}
              description="Subtle vibrations confirm key actions"
              value={hapticEnabled}
              onChange={setHapticEnabled}
            />
          </div>
        </section>

        {/* Backup & Restore Section */}
        <section className="space-y-4 animate-scale-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 shadow-soft">
              <span className="text-lg">💼</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Backup & Restore</h2>
          </div>

          <div className="card rounded-4xl p-6 shadow-soft-lg">
            <p className="text-sm text-slate-600 mb-5 font-medium">Move your local catalog between devices in a single tap</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={handleExport}
                className="group rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-5 py-4 text-sm font-bold text-white shadow-soft-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 focus-ring"
                aria-label="Export all data as JSON file"
              >
                <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">📥</span>
                {t('exportData')}
              </button>

              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 glass px-5 py-4 text-center text-sm font-bold text-brand-700 transition-all duration-300 hover:bg-brand-50 hover:scale-105 active:scale-95 focus-ring">
                <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">📤</span>
                {t('importData')}
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button
                onClick={handleClearData}
                className="group rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 px-5 py-4 text-sm font-bold text-red-600 transition-all duration-300 hover:bg-red-100 hover:scale-105 active:scale-95 focus-ring"
                aria-label="Clear all local data permanently"
              >
                <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🗑️</span>
                {t('clearData')}
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="space-y-4 animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 shadow-soft">
              <span className="text-lg">ℹ️</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{t('about')}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: t('version'), value: '1.0.0', icon: '🏷️', gradient: 'from-blue-100 to-indigo-100' },
              { label: t('productCount'), value: productCount ?? 0, icon: '📦', gradient: 'from-purple-100 to-pink-100' },
              {
                label: t('lastSync'),
                value: syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never',
                icon: '🔄',
                gradient: 'from-green-100 to-emerald-100',
              },
              { label: 'ETag', value: syncStatus?.lastEtag || 'None', icon: '🏷️', gradient: 'from-amber-100 to-yellow-100' },
            ].map((item) => (
              <div key={item.label} className="card rounded-4xl p-6 shadow-soft-lg hover-lift">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-soft`}>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                    <p className="mt-2 text-lg font-black text-slate-900 truncate">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Info */}
        <div className="card rounded-4xl p-6 text-center shadow-soft-lg animate-scale-in" style={{ animationDelay: '0.25s' }}>
          <p className="text-sm text-slate-500">
            Made with <span className="text-red-500">❤️</span> for Product Data Generator
          </p>
          <p className="mt-2 text-xs text-slate-400">
            © 2025 MyApp. All rights reserved.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
