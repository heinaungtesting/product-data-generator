/**
 * i18next Configuration
 * Multi-language support for EN, JA, TH, KO, ZH
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Nav
      home: 'Home',
      compare: 'Compare',
      log: 'Log',
      calendar: 'Calendar',
      settings: 'Settings',

      // Actions
      search: 'Search',
      sync: 'Sync Now',
      syncPull: 'Pull to refresh',
      export: 'Export',
      import: 'Import',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',

      // Home
      products: 'Products',
      categories: 'Categories',
      health: 'Health',
      cosmetic: 'Cosmetic',

      // Details
      description: 'Description',
      effects: 'Effects',
      sideEffects: 'Side Effects',
      goodFor: 'Good For',
      tags: 'Tags',
      pointValue: 'Point Value',

      // Compare
      addToCompare: 'Add to Compare',
      removeFromCompare: 'Remove',
      clearCompare: 'Clear All',
      selectProducts: 'Select 2-4 products to compare',

      // Log
      viewLog: 'View Log',
      editLog: 'Edit Log',
      addNote: 'Add Note',
      exportCsv: 'Export CSV',

      // Settings
      appearance: 'Appearance',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      dataManagement: 'Data Management',
      bundleUrlLabel: 'Bundle URL',
      autoSync: 'Auto Sync',
      hapticFeedback: 'Haptic Feedback',
      exportData: 'Export Data',
      importData: 'Import Data',
      clearData: 'Clear All Data',
      about: 'About',
      version: 'Version',
      schemaVersion: 'Schema Version',
      lastSync: 'Last Sync',
      productCount: 'Product Count',

      // Status
      syncing: 'Syncing...',
      syncSuccess: 'Sync complete',
      syncFailed: 'Sync failed',
      offline: 'Offline',
      noData: 'No data available',
      pullToRefresh: 'Pull to refresh',
    },
  },
  ja: {
    translation: {
      home: 'ホーム',
      compare: '比較',
      log: 'ログ',
      calendar: 'カレンダー',
      settings: '設定',
      search: '検索',
      sync: '同期',
      syncPull: '引いて更新',
      products: '製品',
      health: '健康',
      cosmetic: '化粧品',
      description: '説明',
      effects: '効果',
      sideEffects: '副作用',
      goodFor: '適用',
      tags: 'タグ',
      save: '保存',
      cancel: 'キャンセル',
      syncing: '同期中...',
      syncSuccess: '同期完了',
      offline: 'オフライン',
    },
  },
  th: {
    translation: {
      home: 'หน้าหลัก',
      compare: 'เปรียบเทียบ',
      log: 'บันทึก',
      calendar: 'ปฏิทิน',
      settings: 'ตั้งค่า',
      search: 'ค้นหา',
      sync: 'ซิงค์',
      products: 'ผลิตภัณฑ์',
      health: 'สุขภาพ',
      cosmetic: 'เครื่องสำอาง',
      description: 'คำอธิบาย',
      effects: 'ผลกระทบ',
      sideEffects: 'ผลข้างเคียง',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
    },
  },
  ko: {
    translation: {
      home: '홈',
      compare: '비교',
      log: '로그',
      calendar: '캘린더',
      settings: '설정',
      search: '검색',
      sync: '동기화',
      products: '제품',
      health: '건강',
      cosmetic: '화장품',
      description: '설명',
      effects: '효과',
      sideEffects: '부작용',
      save: '저장',
      cancel: '취소',
    },
  },
  zh: {
    translation: {
      home: '首页',
      compare: '比较',
      log: '日志',
      calendar: '日历',
      settings: '设置',
      search: '搜索',
      sync: '同步',
      products: '产品',
      health: '健康',
      cosmetic: '化妆品',
      description: '描述',
      effects: '效果',
      sideEffects: '副作用',
      save: '保存',
      cancel: '取消',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ja', 'th', 'ko', 'zh'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
