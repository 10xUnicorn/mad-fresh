'use client'

import Link from 'next/link'

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      {/* Icon */}
      <div className="w-14 h-14 rounded-full bg-[#f2efe8] flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-[#9a9080]"
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

      <h2 className="text-lg font-semibold text-[#1e2d18] mb-2">Something went wrong</h2>
      <p className="text-sm text-[#9a9080] text-center max-w-xs mb-6">
        We hit an unexpected error. Try again or head back to the dashboard.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="w-full px-5 py-3 bg-[#3d6b2a] text-white text-sm font-semibold rounded-xl hover:bg-[#2f5720] active:scale-[0.98] transition-all"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="w-full px-5 py-3 bg-[#f2efe8] text-[#1e2d18] text-sm font-medium rounded-xl text-center hover:bg-[#f0ece3] transition-colors"
        >
          Go home
        </Link>
      </div>

      {/* Debug info */}
      {error.message && (
        <p className="text-xs text-[#9a9080]/50 mt-8 text-center break-all max-w-xs">
          {error.message}
        </p>
      )}
    </div>
  )
}
