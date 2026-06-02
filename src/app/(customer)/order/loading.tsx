export default function MenuLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search bar skeleton */}
      <div className="h-11 bg-[#f2efe8] border border-[#ddd8cc] rounded-xl" />

      {/* Category chips */}
      <div className="flex gap-2 overflow-hidden">
        {["Bowls", "Wraps", "Salads", "Sides", "Drinks"].map((cat) => (
          <div key={cat} className="h-9 w-20 bg-[#f2efe8] rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Section header */}
      <div className="h-6 w-24 bg-[#f2efe8] rounded" />

      {/* Menu item cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
            {/* Image placeholder */}
            <div className="w-full h-40 bg-[#f2efe8]" />
            <div className="p-3 space-y-2">
              <div className="h-5 w-3/4 bg-[#f2efe8] rounded" />
              <div className="h-3 w-full bg-[#f2efe8] rounded" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-5 w-16 bg-[#f2efe8] rounded" />
                <div className="h-9 w-9 bg-[#e9f0e4] rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
