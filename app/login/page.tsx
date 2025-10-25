import { LoginForm } from "@/components/LoginForm";
import {
  AUTH_COOKIE_NAME,
  authConfigReady,
  hasValidSessionCookie,
  missingAuthEnvMessage,
} from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const sanitizeRedirectParam = (value?: string | string[]) => {
  if (!value) return "/";
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return "/";
  if (!first.startsWith("/") || first.startsWith("//")) return "/";
  return first;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const redirectTo = sanitizeRedirectParam(resolvedSearchParams?.redirectTo);
  const configReady = authConfigReady();
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (configReady && cookieValue && (await hasValidSessionCookie(cookieValue))) {
    redirect(redirectTo || "/");
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Product Data Generator
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Use the credentials configured via PDG_AUTH_USERNAME and PDG_AUTH_PASSWORD.
            </p>
          </div>

          <LoginForm
            redirectTo={redirectTo}
            configReady={configReady}
            missingAuthMessage={missingAuthEnvMessage}
          />

          <p className="mt-6 text-center text-xs text-slate-400">
            Access restricted to authorized operators only.
          </p>
        </div>
      </div>
    </div>
  );
}
