'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-4xl font-black text-[#1e2d18]">M</span>
          <span className="text-4xl font-black text-[#75F663]">F</span>
        </div>
        <h1 className="text-lg font-bold text-[#1e2d18] tracking-wide">MAD FRESH</h1>
      </div>

      {/* Error content */}
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
          <svg
            className="w-8 h-8 text-[#1e2d18]/40"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-[#1e2d18]">Something went wrong</h2>
        <p className="text-sm text-[#1e2d18]/50 leading-relaxed">
          We hit an unexpected error. Try again or head back to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full mt-4">
          <button
            onClick={reset}
            className="w-full px-5 py-3 bg-[#75F663] text-black text-sm font-semibold rounded-xl hover:bg-[#65e653] active:scale-[0.98] transition-all"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="w-full px-5 py-3 bg-white/5 text-[#1e2d18] text-sm font-medium rounded-xl text-center hover:bg-white/10 transition-colors"
          >
            Go home
          </Link>
        </div>

        {/* Debug info */}
        {error.message && (
          <p className="text-xs text-[#1e2d18]/25 mt-6 break-all">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-xs text-[#1e2d18]/15">
            Digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
