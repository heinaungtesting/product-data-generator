"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  redirectTo: string;
  configReady: boolean;
  missingAuthMessage: string;
};

export function LoginForm({ redirectTo, configReady, missingAuthMessage }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configReady || loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(typeof data?.error === "string" ? data.error : "Unable to sign in.");
        return;
      }

      const destination = redirectTo || "/";
      router.replace(destination);
      if (typeof window !== "undefined") {
        window.location.assign(destination);
      }
    } catch (err) {
      console.error("Login failed", err);
      setError("Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {!configReady && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          {missingAuthMessage}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
        Email or username
        <input
          type="text"
          autoComplete="username"
          className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={!configReady || loading}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
        Password
        <input
          type="password"
          autoComplete="current-password"
          className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={!configReady || loading}
          required
        />
      </label>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!configReady || loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
