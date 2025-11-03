import Link from 'next/link';

export const metadata = {
  title: 'Offline - MyApp',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-2xl font-bold">You&apos;re offline</h1>
        <p className="text-fg/70">
          Don&apos;t worry — you can keep browsing products that were previously synced.
          Come back online to refresh your catalog with the latest bundle.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-white font-medium"
        >
          Back to MyApp
        </Link>
      </div>
    </div>
  );
}
