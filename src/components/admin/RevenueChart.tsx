"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";

interface RevenueData {
  created_at: string;
  total_amount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  formattedDate: string;
}

export default function RevenueChart({ data }: { data: RevenueData[] }) {
  const chartData = useMemo(() => {
    // Group revenue by date
    const dailyMap: Record<string, number> = {};

    if (Array.isArray(data)) {
      data.forEach((order) => {
        const date = format(parseISO(order.created_at), "yyyy-MM-dd");
        dailyMap[date] = (dailyMap[date] || 0) + order.total_amount;
      });
    }

    // Convert to sorted array
    const chartDataArray: DailyRevenue[] = Object.entries(dailyMap)
      .map(([date, revenue]) => ({
        date,
        revenue: revenue / 100, // Convert cents to dollars
        formattedDate: format(parseISO(date), "MMM dd"),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return chartDataArray;
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue Trend</h3>
          <p className="text-sm text-[#9a9080]">Last 30 days of revenue</p>
        </div>
        <div className="text-center py-12">
          <p className="text-[#9a9080] text-sm">No revenue data available</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const minRevenue = Math.min(...chartData.map((d) => d.revenue), 0);
  const range = maxRevenue - minRevenue || 1;

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue Trend</h3>
        <p className="text-sm text-[#9a9080]">Last 30 days of revenue</p>
      </div>

      {/* Simple Bar Chart using SVG-like bars */}
      <div className="space-y-4">
        {/* Chart Header with stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-[#9a9080] mb-1">Total Revenue (30d)</p>
            <p className="text-xl font-bold text-gray-900">
              ${chartData.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9a9080] mb-1">Daily Average</p>
            <p className="text-xl font-bold text-gray-900">
              ${(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9a9080] mb-1">Peak Day</p>
            <p className="text-xl font-bold text-gray-900">
              ${Math.max(...chartData.map((d) => d.revenue)).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Responsive Bar Chart */}
        <div className="overflow-x-auto">
          <div className="flex items-end justify-start gap-1 h-64 px-2 py-4 bg-gradient-to-t from-gray-50 to-transparent rounded-lg min-w-full pb-8">
            {chartData.map((item) => {
              const heightPercent = ((item.revenue - minRevenue) / range) * 100;
              const isHighlight = item.revenue === maxRevenue;

              return (
                <div key={item.date} className="flex-1 flex flex-col items-center group">
                  {/* Bar */}
                  <div className="w-full relative flex flex-col items-center">
                    <div
                      className={`w-full transition-all duration-200 rounded-t-md cursor-pointer hover:opacity-80 ${
                        isHighlight ? "bg-[#3d6b2a]" : "bg-[#3d6b2a]"
                      }`}
                      style={{
                        height: `${heightPercent || 5}%`,
                        minHeight: "2px",
                      }}
                    />

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      ${item.revenue.toFixed(0)}
                    </div>
                  </div>

                  {/* Label - show every 5 days to avoid crowding */}
                  {chartData.indexOf(item) % 5 === 0 && (
                    <div className="text-xs text-[#9a9080] mt-2 text-center font-medium">
                      {item.formattedDate}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis label */}
          <div className="text-center text-xs text-[#9a9080] mt-4">
            {chartData.length} days
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#3d6b2a]" />
          <span className="text-xs text-[#9a9080]">Regular Days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#3d6b2a]" />
          <span className="text-xs text-[#9a9080]">Peak Day</span>
        </div>
      </div>
    </div>
  );
}
