'use client'

import Link from 'next/link'

export default function CustomerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      <p className="text-5xl font-black text-[#3d6b2a] mb-4">404</p>

      <h2 className="text-lg font-semibold text-[#1e2d18] mb-2">Page not found</h2>
      <p className="text-sm text-[#9a9080] text-center max-w-xs mb-6">
        This page doesn&apos;t exist or may have been moved.
      </p>

      <Link
        href="/dashboard"
        className="px-5 py-3 bg-[#3d6b2a] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#2f5720] active:scale-[0.98] transition-all"
      >
        Go to dashboard
      </Link>
    </div>
  )
}
