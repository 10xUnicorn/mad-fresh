"use client";

interface OrderStatusBadgesProps {
  statusCounts: Record<string, number>;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-800", icon: "⏳" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-800", icon: "✓" },
  preparing: { bg: "bg-purple-50", text: "text-purple-800", icon: "👨‍🍳" },
  ready: { bg: "bg-cyan-50", text: "text-cyan-800", icon: "📦" },
  out_for_delivery: { bg: "bg-orange-50", text: "text-orange-800", icon: "🚗" },
  delivered: { bg: "bg-green-50", text: "text-green-800", icon: "✓✓" },
  cancelled: { bg: "bg-red-50", text: "text-red-800", icon: "✕" },
};

export default function OrderStatusBadges({ statusCounts }: OrderStatusBadgesProps) {
  if (Object.keys(statusCounts).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9a9080] text-sm">No order status data available</p>
      </div>
    );
  }

  const totalOrders = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  // Sort by count descending
  const sortedStatuses = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
    }));

  return (
    <div className="space-y-4">
      {sortedStatuses.map(({ status, count, percentage }) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

        return (
          <div key={status} className="space-y-2">
            {/* Status Badge and Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${config.bg} ${config.text}`}>
                  <span className="mr-2">{STATUS_CONFIG[status]?.icon}</span>
                  {status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-900 font-semibold">{count}</span>
                <span className="text-[#9a9080] text-sm ml-2">({percentage}%)</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  status === "delivered"
                    ? "bg-green-500"
                    : status === "cancelled"
                      ? "bg-red-500"
                      : status === "ready"
                        ? "bg-cyan-500"
                        : status === "out_for_delivery"
                          ? "bg-orange-500"
                          : status === "preparing"
                            ? "bg-purple-500"
                            : status === "confirmed"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-[#9a9080] mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700 mb-1">Completed Rate</p>
            <p className="text-2xl font-bold text-green-700">
              {statusCounts.delivered ? Math.round((statusCounts.delivered / totalOrders) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
