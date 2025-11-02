'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@/lib/hooks';
import AppShell from '@/components/AppShell';
import { useAppStore, type Theme } from '@/lib/store';
import { db } from '@/lib/db';
import { getSyncStatus } from '@/lib/sync';

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

  const [showUrlEdit, setShowUrlEdit] = useState(false);
  const [urlInput, setUrlInput] = useState(bundleUrl);

  const syncStatus = useLiveQuery(() => getSyncStatus());
  const productCount = useLiveQuery(() => db.products.count());

  const handleExport = async () => {
    const data = await db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myapp-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);
    await db.importData(data);
    alert('Import complete!');
  };

  const handleClearData = async () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      await db.clearAll();
      alert('Data cleared');
    }
  };

  return (
    <AppShell>
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">{t('settings')}</h1>

        {/* Appearance */}
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('appearance')}</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">{t('theme')}</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'auto'] as Theme[]).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => setTheme(themeOption)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium min-h-[44px] ${
                      theme === themeOption
                        ? 'bg-accent text-white'
                        : 'bg-fg/5 text-fg hover:bg-fg/10'
                    }`}
                  >
                    {t(themeOption)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('dataManagement')}</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">{t('bundleUrlLabel')}</label>
              {showUrlEdit ? (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-fg/20 rounded-lg bg-bg text-fg"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => {
                      setBundleUrl(urlInput);
                      setShowUrlEdit(false);
                    }}
                    className="px-4 py-2 bg-accent text-white rounded-lg min-h-[44px]"
                  >
                    {t('save')}
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setShowUrlEdit(true)}
                  className="p-3 bg-fg/5 rounded-lg text-sm text-fg/60 cursor-pointer hover:bg-fg/10"
                >
                  {bundleUrl || 'Not configured'}
                </div>
              )}
            </div>

            <label className="flex items-center justify-between p-3 bg-fg/5 rounded-lg cursor-pointer hover:bg-fg/10">
              <span className="font-medium">{t('autoSync')}</span>
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="w-6 h-6 rounded accent-accent"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-fg/5 rounded-lg cursor-pointer hover:bg-fg/10">
              <span className="font-medium">{t('hapticFeedback')}</span>
              <input
                type="checkbox"
                checked={hapticEnabled}
                onChange={(e) => setHapticEnabled(e.target.checked)}
                className="w-6 h-6 rounded accent-accent"
              />
            </label>
          </div>
        </section>

        {/* Backup */}
        <section>
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full py-3 px-4 bg-accent text-white rounded-lg font-medium min-h-[44px]"
            >
              {t('exportData')}
            </button>

            <label className="block w-full py-3 px-4 bg-fg/10 text-fg rounded-lg font-medium text-center cursor-pointer hover:bg-fg/20 min-h-[44px]">
              {t('importData')}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleClearData}
              className="w-full py-3 px-4 bg-danger text-white rounded-lg font-medium min-h-[44px]"
            >
              {t('clearData')}
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('about')}</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-3 bg-fg/5 rounded-lg">
              <span className="text-fg/60">{t('version')}</span>
              <span className="font-medium">1.0.0</span>
            </div>

            <div className="flex justify-between p-3 bg-fg/5 rounded-lg">
              <span className="text-fg/60">{t('productCount')}</span>
              <span className="font-medium">{productCount || 0}</span>
            </div>

            <div className="flex justify-between p-3 bg-fg/5 rounded-lg">
              <span className="text-fg/60">{t('lastSync')}</span>
              <span className="font-medium">
                {syncStatus?.lastSync
                  ? new Date(syncStatus.lastSync).toLocaleString()
                  : 'Never'}
              </span>
            </div>

            <div className="flex justify-between p-3 bg-fg/5 rounded-lg">
              <span className="text-fg/60">ETag</span>
              <span className="font-mono text-xs">{syncStatus?.lastEtag || 'None'}</span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
