'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0a1a0a] flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold text-[#1e2d18]">Something went wrong</h2>
      {error.message && (
        <p className="text-sm text-[#9a9080] max-w-sm text-center">{error.message}</p>
      )}
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 bg-[#3d6b2a] text-black text-sm font-medium rounded-md hover:bg-[#449531] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
