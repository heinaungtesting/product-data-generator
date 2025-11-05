/**
 * Zustand Global State Management
 * Manages app-wide state including language, theme, sync status
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'en' | 'ja' | 'th' | 'ko' | 'zh';
export type Theme = 'light' | 'dark' | 'auto';

interface AppState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sync status
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;

  lastSyncTime: string | null;
  setLastSyncTime: (time: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Settings
  bundleUrl: string;
  setBundleUrl: (url: string) => void;

  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;

  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Language
      language: 'en',
      setLanguage: (language) => set({ language }),

      // Theme
      theme: 'auto',
      setTheme: (theme) => set({ theme }),

      // Sync
      isSyncing: false,
      setIsSyncing: (isSyncing) => set({ isSyncing }),

      lastSyncTime: null,
      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

      // Search
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      // Settings
      bundleUrl: '',
      setBundleUrl: (bundleUrl) => set({ bundleUrl }),

      autoSyncEnabled: true,
      setAutoSyncEnabled: (autoSyncEnabled) => set({ autoSyncEnabled }),

      hapticEnabled: true,
      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
    }),
    {
      name: 'myapp-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        bundleUrl: state.bundleUrl,
        autoSyncEnabled: state.autoSyncEnabled,
        hapticEnabled: state.hapticEnabled,
      }),
    }
  )
);

/**
 * Trigger haptic feedback if enabled
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  const { hapticEnabled } = useAppStore.getState();

  if (!hapticEnabled || !('vibrate' in navigator)) {
    return;
  }

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30, 10, 30],
  };

  navigator.vibrate(patterns[type]);
}
