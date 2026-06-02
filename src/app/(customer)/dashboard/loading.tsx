export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Greeting + Level */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-[#f2efe8] rounded-lg" />
        <div className="h-6 w-20 bg-[#f2efe8] rounded-full" />
      </div>

      {/* 3-stat row */}
      <div className="flex items-stretch gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 bg-white border border-[#ddd8cc] rounded-xl px-3 py-3 text-center">
            <div className="h-6 w-12 bg-[#f2efe8] rounded mx-auto mb-1" />
            <div className="h-3 w-10 bg-[#f2efe8] rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Level progress bar */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-1.5 bg-[#f2efe8] rounded-full" />
        <div className="h-3 w-24 bg-[#f2efe8] rounded" />
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <div className="h-10 w-28 bg-[#e9f0e4] rounded-full" />
        <div className="h-10 w-28 bg-[#f2efe8] rounded-full" />
        <div className="h-10 w-28 bg-[#f2efe8] rounded-full" />
      </div>

      {/* Reorder section */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-4 space-y-3">
        <div className="h-5 w-32 bg-[#f2efe8] rounded" />
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 h-24 bg-[#f2efe8] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="h-4 w-28 bg-[#f2efe8] rounded" />
          <div className="h-3 w-14 bg-[#f2efe8] rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-[#ddd8cc] rounded-xl px-3.5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f2efe8] rounded-lg" />
                <div>
                  <div className="h-4 w-20 bg-[#f2efe8] rounded mb-1" />
                  <div className="h-3 w-14 bg-[#f2efe8] rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-[#f2efe8] rounded-full" />
                <div className="h-4 w-12 bg-[#f2efe8] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
