'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser, clearSession } from '@/lib/supabase';

type Language = 'ja' | 'en' | 'zh' | 'th' | 'ko';

const languages = [
  { code: 'ja' as Language, label: '日本語', flag: '🇯🇵', name: 'Japanese' },
  { code: 'en' as Language, label: 'English', flag: '🇺🇸', name: 'English' },
  { code: 'zh' as Language, label: '中文', flag: '🇨🇳', name: 'Chinese' },
  { code: 'th' as Language, label: 'ไทย', flag: '🇹🇭', name: 'Thai' },
  { code: 'ko' as Language, label: '한국어', flag: '🇰🇷', name: 'Korean' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('ja');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace('/login');
        return;
      }

      // If already completed onboarding, redirect to home
      if (currentUser.onboarding_completed) {
        router.replace('/');
        return;
      }

      setUser(currentUser);
    };

    checkAuth();
  }, [router]);

  const handleContinue = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Update user's language preference and mark onboarding as completed
      const { error } = await supabase
        .from('users')
        .update({
          language_preference: selectedLanguage,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Vibrate on success
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Redirect to home
      router.replace('/');
    } catch (error) {
      console.error('Onboarding error:', error);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Use default language (Japanese) and continue
    handleContinue();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">↻</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Welcome Header */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-brand shadow-brand-lg mb-4">
            <span className="text-4xl">👋</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 text-gradient">
            Welcome, {user.nickname}!
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Let's set up your language preference
          </p>
        </div>

        {/* Language Selection */}
        <div className="card rounded-5xl p-8 shadow-soft-lg animate-scale-in space-y-6" style={{ animationDelay: '0.1s' }}>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Choose your language
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              This will be used to display product information. You can change this later in settings.
            </p>

            {/* Language Options */}
            <div className="space-y-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 focus-ring ${
                    selectedLanguage === lang.code
                      ? 'bg-gradient-brand text-white shadow-brand scale-105'
                      : 'glass text-slate-700 hover:bg-white hover:scale-105 active:scale-95 shadow-soft'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <p className={`font-bold ${selectedLanguage === lang.code ? 'text-white' : 'text-slate-900'}`}>
                      {lang.label}
                    </p>
                    <p className={`text-xs ${selectedLanguage === lang.code ? 'text-white/80' : 'text-slate-500'}`}>
                      {lang.name}
                    </p>
                  </div>
                  {selectedLanguage === lang.code && (
                    <div className="flex-shrink-0">
                      <span className="text-xl">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleContinue}
              disabled={loading}
              className="btn-primary w-full py-4 text-base shadow-brand-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block animate-spin text-xl">↻</span>
                  Setting up...
                </span>
              ) : (
                'Continue'
              )}
            </button>

            <button
              onClick={handleSkip}
              disabled={loading}
              className="btn-secondary w-full py-4 text-base"
            >
              Use Default (Japanese)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => {
              clearSession();
              router.replace('/login');
            }}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
