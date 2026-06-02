'use client'

import Link from 'next/link'

export default function NotFound() {
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

      {/* 404 content */}
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <p className="text-6xl font-black text-[#75F663]">404</p>

        <h2 className="text-xl font-semibold text-[#1e2d18]">Page not found</h2>
        <p className="text-sm text-[#1e2d18]/50 leading-relaxed">
          This page doesn&apos;t exist or may have been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full mt-4">
          <Link
            href="/dashboard"
            className="w-full px-5 py-3 bg-[#3d6b2a] text-black text-sm font-semibold rounded-xl text-center hover:bg-[#65e653] active:scale-[0.98] transition-all"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="w-full px-5 py-3 bg-white/5 text-[#1e2d18] text-sm font-medium rounded-xl text-center hover:bg-white/10 transition-colors"
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  )
}
