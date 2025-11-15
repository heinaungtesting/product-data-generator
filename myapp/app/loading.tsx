export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-accent-50/30 to-white flex items-center justify-center">
      <div className="relative">
        {/* Primary spinner */}
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600 shadow-brand" />

        {/* Pulse effect */}
        <div className="absolute inset-0 h-20 w-20 animate-ping rounded-full border-4 border-brand-300 opacity-20" />

        {/* Glow effect */}
        <div className="absolute inset-0 h-20 w-20 rounded-full blur-xl bg-brand-400/30 animate-glow-pulse" />
      </div>
    </div>
  );
}
