'use client'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold text-[#1e2d18]">Something went wrong</h2>
      {error.message && (
        <p className="text-sm text-[#1e2d18]/50 max-w-sm text-center">{error.message}</p>
      )}
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 bg-[#75F663] text-black text-sm font-medium rounded-md hover:bg-[#449531] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
