import { createClient } from "@/lib/supabase/server";
import { ShoppingBag, TrendingUp, DollarSign, Clock, Plus, Search, Eye } from "lucide-react";
import Link from "next/link";
import CreateOrderForm from "@/components/admin/CreateOrderForm";
import { StatusBadge, PaymentStatusBadge, OrderTypeBadge } from "@/components/admin/OrderBadges";

function StatsCard({ icon: Icon, label, value, prefix = "", suffix = "" }: {
  icon: any; label: string; value: string | number; prefix?: string; suffix?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-[#E8F5E3]">
          <Icon size={24} className="text-[#3d6b2a]" />
        </div>
      </div>
      <p className="text-[#9a9080] text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{prefix}{value}{suffix}</p>
    </div>
  );
}

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const statusFilter = params.status || "all";
  const searchQuery = params.q || "";

  // Fetch all orders for stats
  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, total_amount, status")
    .eq("store_id", STORE_ID);

  // Fetch filtered orders
  let query = supabase
    .from("orders")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (searchQuery) {
    query = query.or(
      `customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,order_number.ilike.%${searchQuery}%`
    );
  }

  const { data: orders } = await query.limit(100);

  // Stats from all orders
  const totalOrders = allOrders?.length || 0;
  const totalRevenue = allOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingOrders = allOrders?.filter((o) => o.status === "pending").length || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1e2d18]">Orders</h1>
        <CreateOrderForm>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl transition-colors font-medium">
            <Plus size={20} /> New Order
          </button>
        </CreateOrderForm>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={ShoppingBag} label="Total Orders" value={totalOrders} />
        <StatsCard icon={DollarSign} label="Revenue" value={formatCurrency(totalRevenue)} />
        <StatsCard icon={TrendingUp} label="Avg Order Value" value={formatCurrency(avgOrderValue)} />
        <StatsCard icon={Clock} label="Pending Orders" value={pendingOrders} />
      </div>

      {/* Filters + Search */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={`/admin/orders?status=${f.key}${searchQuery ? `&q=${searchQuery}` : ""}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === f.key
                      ? "bg-[#3d6b2a] text-white"
                      : "bg-[#f2efe8] text-[#9a9080] hover:bg-[#f0ece3]"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>

            {/* Search */}
            <form method="GET" action="/admin/orders" className="flex items-center gap-2">
              <input type="hidden" name="status" value={statusFilter} />
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search orders..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Orders Table */}
        {orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.customer_name || "Guest"}</p>
                      <p className="text-xs text-[#9a9080]">{order.customer_email || order.customer_id?.substring(0, 8) || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm"><OrderTypeBadge type={order.order_type} /></td>
                    <td className="px-6 py-4 text-sm"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4 text-sm font-medium text-[#3d6b2a]">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4 text-sm"><PaymentStatusBadge status={order.payment_status} /></td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{formatDate(order.created_at)}</p>
                      <p className="text-xs text-[#7a7060]">{formatTime(order.created_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#E8F5E3] text-[#3d6b2a] rounded-lg text-xs font-semibold hover:bg-[#d4eecf] transition-colors"
                      >
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <ShoppingBag size={32} className="mx-auto mb-3 text-[#7a7060]" />
            <p className="text-[#9a9080] mb-1">No orders found</p>
            <p className="text-[#7a7060] text-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search terms."
                : "Orders will appear here once customers start ordering."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
