export default function OrdersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-32 bg-[#f2efe8] rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#ddd8cc] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-24 bg-[#f2efe8] rounded" />
              <div className="h-5 w-20 bg-[#f2efe8] rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-[#f2efe8] rounded" />
              <div className="h-5 w-16 bg-[#f2efe8] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
