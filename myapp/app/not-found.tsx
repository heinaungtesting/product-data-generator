import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-accent-50/30 to-white flex items-center justify-center p-6">
      <div className="card rounded-5xl p-12 text-center max-w-md shadow-brand-lg">
        <div className="mb-6 text-7xl animate-float">🔍</div>

        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          404
        </h1>

        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Page Not Found
        </h2>

        <p className="text-base text-slate-600 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 btn-primary px-8 py-4 shadow-brand-lg"
        >
          <span className="text-lg">🏠</span>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
