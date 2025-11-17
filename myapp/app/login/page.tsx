'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { supabase, setSession, getSession } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Query user by nickname
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('nickname', nickname)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        setError('Invalid nickname or PIN');
        setLoading(false);
        return;
      }

      // Verify PIN
      const isValidPin = await bcrypt.compare(pin, user.pin_hash);

      if (!isValidPin) {
        setError('Invalid nickname or PIN');
        setLoading(false);
        return;
      }

      // Check if onboarding is completed
      if (!user.onboarding_completed) {
        // Set session and redirect to onboarding
        setSession(user.id, user.nickname, user.role);
        router.replace('/onboarding');
        return;
      }

      // Set session
      setSession(user.id, user.nickname, user.role);

      // Vibrate on success (if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Redirect to home
      router.replace('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-brand shadow-brand-lg mb-4">
            <span className="text-4xl">📦</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 text-gradient">
            MyApp
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to track your sales
          </p>
        </div>

        {/* Login Form */}
        <div className="card rounded-5xl p-8 shadow-soft-lg animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Nickname Input */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-bold text-slate-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                required
                autoComplete="username"
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* PIN Input */}
            <div>
              <label htmlFor="pin" className="block text-sm font-bold text-slate-700 mb-2">
                PIN
              </label>
              <input
                type="password"
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                required
                autoComplete="current-password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="input-field text-2xl tracking-widest"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl px-4 py-3 bg-red-50 border border-red-200 animate-slide-down">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base shadow-brand-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block animate-spin text-xl">↻</span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Contact your admin if you need help accessing your account
        </p>
      </div>
    </div>
  );
}
