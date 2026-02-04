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
      
      // Tourist-friendly messages
      welcome: 'Welcome! 🌏 Japanese Drugstore Product Guide',
      welcomeSubtitle: 'Find health & beauty products with descriptions in your language',
      chooseLanguage: '🌍 Choose Your Language',
      touristTip: '💡 Tip: Show this screen to store staff for assistance',
      addToList: '📋 Add to My List',
      added: '✓ Added!',
      noProductsFound: 'No products found',
      tryDifferentSearch: 'Try a different search or browse all products',

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
      
      // Tourist-friendly messages
      welcome: 'ようこそ！🌏 日本のドラッグストア製品ガイド',
      welcomeSubtitle: 'あなたの言語で健康・美容製品を検索',
      chooseLanguage: '🌍 言語を選択',
      touristTip: '💡 ヒント：店員にこの画面を見せてください',
      addToList: '📋 リストに追加',
      added: '✓ 追加しました！',
      noProductsFound: '製品が見つかりません',
      tryDifferentSearch: '別の検索を試すか、すべての製品を閲覧してください',
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
      
      // Tourist-friendly messages
      welcome: 'ยินดีต้อนรับ! 🌏 คู่มือผลิตภัณฑ์ร้านขายยาญี่ปุ่น',
      welcomeSubtitle: 'ค้นหาผลิตภัณฑ์สุขภาพและความงามพร้อมคำอธิบายในภาษาของคุณ',
      chooseLanguage: '🌍 เลือกภาษาของคุณ',
      touristTip: '💡 เคล็ดลับ: แสดงหน้าจอนี้ให้พนักงานดู',
      addToList: '📋 เพิ่มในรายการของฉัน',
      added: '✓ เพิ่มแล้ว!',
      noProductsFound: 'ไม่พบผลิตภัณฑ์',
      tryDifferentSearch: 'ลองค้นหาอื่นหรือเรียกดูผลิตภัณฑ์ทั้งหมด',
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
      
      // Tourist-friendly messages
      welcome: '환영합니다! 🌏 일본 드러그스토어 제품 가이드',
      welcomeSubtitle: '귀하의 언어로 건강 및 미용 제품을 찾아보세요',
      chooseLanguage: '🌍 언어 선택',
      touristTip: '💡 팁: 직원에게 이 화면을 보여주세요',
      addToList: '📋 내 목록에 추가',
      added: '✓ 추가됨!',
      noProductsFound: '제품을 찾을 수 없습니다',
      tryDifferentSearch: '다른 검색을 시도하거나 모든 제품을 찾아보세요',
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
      
      // Tourist-friendly messages
      welcome: '欢迎！🌏 日本药妆店产品指南',
      welcomeSubtitle: '用您的语言查找健康和美容产品说明',
      chooseLanguage: '🌍 选择您的语言',
      touristTip: '💡 提示：向店员展示此屏幕以获得帮助',
      addToList: '📋 添加到我的列表',
      added: '✓ 已添加！',
      noProductsFound: '未找到产品',
      tryDifferentSearch: '尝试不同的搜索或浏览所有产品',
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
