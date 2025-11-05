'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/AppShell';
import { useLiveQuery } from '@/lib/hooks';
import { useAppStore, type Theme } from '@/lib/store';
import { db, getTotalImageSize, getImageCount } from '@/lib/db';
import { getSyncStatus } from '@/lib/sync';
import { formatBytes, checkStorageQuota } from '@/lib/imageUtils';

interface PreferenceToggleProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

function PreferenceToggle({ label, description, value, onChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-inner shadow-slate-200">
      <div>
        <p className="text-base font-semibold text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition ${
          value ? 'bg-indigo-600' : 'bg-slate-200'
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
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
  const [storageInfo, setStorageInfo] = useState({
    imageSizeBytes: 0,
    imageCount: 0,
    quotaUsedPercent: 0,
  });

  const syncStatus = useLiveQuery(() => getSyncStatus());
  const productCount = useLiveQuery(() => db.products.count());

  useEffect(() => {
    const loadStorageInfo = async () => {
      const [totalSize, count, quota] = await Promise.all([
        getTotalImageSize(),
        getImageCount(),
        checkStorageQuota(),
      ]);

      setStorageInfo({
        imageSizeBytes: totalSize,
        imageCount: count,
        quotaUsedPercent: quota.percentUsed,
      });
    };

    loadStorageInfo();
  }, []);

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
      setStorageInfo({ imageSizeBytes: 0, imageCount: 0, quotaUsedPercent: 0 });
      alert('Data cleared');
    }
  };

  const handleClearImages = async () => {
    if (window.confirm('Clear all product images? Product data will remain.')) {
      await db.productImages.clear();
      setStorageInfo({ ...storageInfo, imageSizeBytes: 0, imageCount: 0 });
      alert('Images cleared');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-indigo-100">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">{t('settings')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Control center</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage appearance, syncing, and data controls for the Product Data Generator companion app.
          </p>
        </section>

        <section className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('appearance')}</h2>
          <p className="text-sm text-slate-500">Choose how the interface adapts to your environment.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(['light', 'dark', 'auto'] as Theme[]).map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  theme === option
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-inner shadow-indigo-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-100'
                }`}
              >
                {t(option)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-4xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('dataManagement')}</h2>
          <div className="rounded-2xl border border-indigo-50 bg-indigo-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t('bundleUrlLabel')}</p>
                <p className="text-xs text-slate-500">Remote source for the synced bundle</p>
              </div>
              <button
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {isEditingUrl ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditingUrl ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="https://example.com/bundle.json.gz"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-300 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setBundleUrl(urlInput);
                    setIsEditingUrl(false);
                  }}
                  className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40"
                >
                  {t('save')}
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm text-slate-600">
                {bundleUrl || 'Not configured'}
              </p>
            )}
          </div>

          <PreferenceToggle
            label={t('autoSync')}
            description="Refresh bundle once per hour when enabled"
            value={autoSyncEnabled}
            onChange={setAutoSyncEnabled}
          />

          <PreferenceToggle
            label={t('hapticFeedback')}
            description="Subtle vibrations confirm key actions"
            value={hapticEnabled}
            onChange={setHapticEnabled}
          />
        </section>

        <section className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Image Storage</h2>
          <p className="text-sm text-slate-500">Manage photos stored locally on your device.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Images Stored</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{storageInfo.imageCount}</p>
              <p className="text-xs text-slate-500">Product photos</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Storage Used</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatBytes(storageInfo.imageSizeBytes)}
              </p>
              <p className="text-xs text-slate-500">For images only</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quota Used</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {storageInfo.quotaUsedPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">Device storage</p>
            </div>
          </div>

          {storageInfo.quotaUsedPercent > 80 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-900">Storage Warning</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You&apos;re using {storageInfo.quotaUsedPercent.toFixed(0)}% of device storage. Consider clearing old images to free up space.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={handleClearImages}
              disabled={storageInfo.imageCount === 0}
              className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-600 shadow-inner shadow-red-100 transition hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All Images ({storageInfo.imageCount})
            </button>
          </div>
        </section>

        <section className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Backup & restore</h2>
          <p className="text-sm text-slate-500">Move your local catalog between devices in a single tap.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <button
              onClick={handleExport}
              className="rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition active:scale-[0.99]"
            >
              {t('exportData')}
            </button>

            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-semibold text-slate-700 shadow-inner shadow-slate-100 transition hover:border-indigo-200">
              {t('importData')}
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handleClearData}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-600 shadow-inner shadow-red-100 transition hover:bg-red-100"
            >
              {t('clearData')}
            </button>
          </div>
        </section>

        <section className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('about')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { label: t('version'), value: '1.0.0' },
              { label: t('productCount'), value: productCount ?? 0 },
              {
                label: t('lastSync'),
                value: syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never',
              },
              { label: 'ETag', value: syncStatus?.lastEtag || 'None' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
