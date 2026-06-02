import { createClient } from "@/lib/supabase/server";
import { Users, MessageSquare, ListChecks, ChefHat, ShoppingBag, DollarSign, TrendingUp, Clock, AlertCircle, BarChart3 } from "lucide-react";
import RevenueChart from "@/components/admin/RevenueChart";
import OrderStatusBadges from "@/components/admin/OrderStatusBadges";
import { formatDistanceToNow } from "date-fns";

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
}: {
  icon: any;
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: number;
}) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-[#E8F5E3]">
          <Icon size={24} className="text-[#3d6b2a]" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            <TrendingUp size={16} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[#9a9080] text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">
        {prefix}
        {value}
        {suffix}
      </p>
    </div>
  );
}

// Horizontal Bar Chart
function HorizontalBarChart({
  label,
  items,
}: {
  label: string;
  items: { name: string; count: number }[];
}) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-700 font-medium">{item.name}</span>
            <span className="text-[#3d6b2a] font-semibold">{item.count}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#3d6b2a] h-full rounded-full transition-all"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Ranked List Component
function RankedList({
  items,
  showRevenue = false,
}: {
  items: { rank: number; name: string; count: number; revenue?: number }[];
  showRevenue?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag size={32} className="mx-auto mb-3 text-[#9a9080]" />
        <p className="text-[#9a9080] text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.rank} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3d6b2a] text-white text-sm font-bold">
            {item.rank}
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-medium">{item.name}</p>
            <p className="text-[#9a9080] text-sm">{item.count} order{item.count !== 1 ? "s" : ""}</p>
          </div>
          {showRevenue && item.revenue && (
            <div className="text-right">
              <p className="text-gray-900 font-semibold">${(item.revenue / 100).toFixed(2)}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Recent Activity Component
function RecentActivity({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={32} className="mx-auto mb-3 text-[#9a9080]" />
        <p className="text-[#9a9080] text-sm">No recent orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
          <div className="flex-1">
            <p className="text-gray-900 font-medium">{order.customer_name || "Guest"}</p>
            <div className="flex items-center gap-2 text-[#9a9080] text-sm mt-1">
              <Clock size={14} />
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-900 font-semibold">${(order.total_amount / 100).toFixed(2)}</p>
            <div className="mt-1">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                order.status === "delivered" ? "bg-green-100 text-green-800" :
                order.status === "cancelled" ? "bg-red-100 text-red-800" :
                order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // Get today's date
  const today = new Date();
  const dateDisplay = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Get last 30 days date
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get first day of current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Fetch all analytics data in parallel
  const [
    { count: totalContacts },
    { count: totalRsvps },
    { count: waitlistCount },
    { count: menuItemsCount },
    { count: ordersCount },
    { data: revenueOrders },
    { data: monthlyOrders },
    { count: activeSubscriptionsCount },
    { data: contactsBySource },
    { data: rsvpsByStatus },
    { data: popularItems },
    { data: recentOrders },
    { data: ordersByStatus },
    { data: last30DaysRevenue },
  ] = await Promise.all([
    // Total contacts
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("store_id", STORE_ID),
    // Total RSVPs
    supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true }),
    // Waitlist members
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("store_id", STORE_ID)
      .eq("is_waitlist_member", true),
    // Total menu items
    supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("store_id", STORE_ID)
      .eq("is_available", true),
    // Total orders
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", STORE_ID),
    // Total revenue (all orders, not cancelled)
    supabase
      .from("orders")
      .select("total_amount")
      .eq("store_id", STORE_ID)
      .neq("status", "cancelled"),
    // Monthly orders (this month)
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("store_id", STORE_ID)
      .gte("created_at", monthStart.toISOString()),
    // Active subscribers
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("store_id", STORE_ID)
      .eq("status", "active"),
    // Contacts by source (raw data)
    supabase
      .from("contacts")
      .select("source")
      .eq("store_id", STORE_ID),
    // RSVPs by status (raw data)
    supabase
      .from("event_rsvps")
      .select("status"),
    // Popular items (top 10)
    supabase
      .from("order_items")
      .select("recipe_id, recipes(id, name), line_total")
      .eq("orders.store_id", STORE_ID)
      .order("id", { ascending: false })
      .limit(1000),
    // Recent orders (last 10)
    supabase
      .from("orders")
      .select("id, customer_name, total_amount, status, created_at")
      .eq("store_id", STORE_ID)
      .order("created_at", { ascending: false })
      .limit(10),
    // Orders by status
    supabase
      .from("orders")
      .select("status")
      .eq("store_id", STORE_ID),
    // Last 30 days revenue
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .eq("store_id", STORE_ID)
      .neq("status", "cancelled")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  // Calculate total revenue
  const totalRevenue = revenueOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  // Calculate average order value
  const aov = ordersCount ? Math.round(totalRevenue / ordersCount) : 0;

  // Process contacts by source
  const sourceMap: Record<string, number> = {};
  contactsBySource?.forEach((contact: any) => {
    sourceMap[contact.source] = (sourceMap[contact.source] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap)
    .map(([source, count]) => ({
      name: source.replace(/_/g, " "),
      count: count as number,
    }))
    .sort((a, b) => b.count - a.count);

  // Process RSVPs by status
  const statusMap: Record<string, number> = {};
  rsvpsByStatus?.forEach((rsvp: any) => {
    statusMap[rsvp.status] = (statusMap[rsvp.status] || 0) + 1;
  });
  const statusData = Object.entries(statusMap)
    .map(([status, count]) => ({
      name: status,
      count: count as number,
    }))
    .sort((a, b) => b.count - a.count);

  // Process popular items
  const itemMap: Record<string, { count: number; revenue: number }> = {};
  if (Array.isArray(popularItems)) {
    popularItems.forEach((item: any) => {
      const name = item.recipes?.name || "Unknown Item";
      if (!itemMap[name]) {
        itemMap[name] = { count: 0, revenue: 0 };
      }
      itemMap[name].count += 1;
      itemMap[name].revenue += item.line_total || 0;
    });
  }
  const topItems = Object.entries(itemMap)
    .map(([name, data]) => ({
      rank: 0,
      name,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Process orders by status
  const statusCountMap: Record<string, number> = {};
  ordersByStatus?.forEach((order: any) => {
    statusCountMap[order.status] = (statusCountMap[order.status] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-[#1e2d18] text-3xl font-bold flex items-center gap-3 mb-2">
          <BarChart3 size={32} className="text-[#3d6b2a]" />
          Analytics Dashboard
        </h1>
        <p className="text-[#7a7060]">Comprehensive overview of your business metrics</p>
      </div>

      {/* Revenue KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={DollarSign}
          label="Total Revenue"
          value={(totalRevenue / 100).toFixed(2)}
          prefix="$"
        />
        <KPICard
          icon={ShoppingBag}
          label="Orders This Month"
          value={ordersCount?.toString() || 0}
        />
        <KPICard
          icon={TrendingUp}
          label="Average Order Value"
          value={(aov / 100).toFixed(2)}
          prefix="$"
        />
        <KPICard
          icon={Users}
          label="Active Subscribers"
          value={activeSubscriptionsCount || 0}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={last30DaysRevenue || []} />

      {/* Popular Items & Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Popular Items</h3>
            <p className="text-sm text-[#9a9080]">Top 10 most ordered items</p>
          </div>
          <RankedList items={topItems} showRevenue={true} />
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Order Status Breakdown</h3>
            <p className="text-sm text-[#9a9080]">Distribution by status</p>
          </div>
          <OrderStatusBadges statusCounts={statusCountMap} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Recent Activity</h3>
          <p className="text-sm text-[#9a9080]">Last 10 orders</p>
        </div>
        <RecentActivity orders={recentOrders || []} />
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Growth by Source */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Contact Growth</h3>
            <p className="text-sm text-[#9a9080]">Contacts by source</p>
          </div>
          {sourceData.length > 0 ? (
            <HorizontalBarChart label="Contacts by Source" items={sourceData} />
          ) : (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto mb-3 text-[#9a9080]" />
              <p className="text-[#9a9080] text-sm">No contact data available</p>
            </div>
          )}
        </div>

        {/* RSVP Status Breakdown */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">RSVP Status Breakdown</h3>
            <p className="text-sm text-[#9a9080]">RSVPs by status</p>
          </div>
          {statusData.length > 0 ? (
            <HorizontalBarChart label="RSVPs by Status" items={statusData} />
          ) : (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto mb-3 text-[#9a9080]" />
              <p className="text-[#9a9080] text-sm">No RSVP data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Users} label="Total Contacts" value={totalContacts || 0} />
        <KPICard icon={MessageSquare} label="Total RSVPs" value={totalRsvps || 0} />
        <KPICard icon={ListChecks} label="Waitlist Size" value={waitlistCount || 0} />
        <KPICard icon={ChefHat} label="Available Menu Items" value={menuItemsCount || 0} />
      </div>

      {/* Data Timestamp */}
      <div className="text-center text-sm text-[#7a7060]">
        as of {dateDisplay}
      </div>
    </div>
  );
}
