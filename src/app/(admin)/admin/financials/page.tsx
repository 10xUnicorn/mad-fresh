import { createClient } from "@/lib/supabase/server";
import { DollarSign, TrendingUp, ShoppingBag, Users, CreditCard } from "lucide-react";

export default async function FinancialsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const [{ data: orders }, { data: subscriptions }, { data: plans }, { data: expenses }] = await Promise.all([
    supabase.from("orders").select("*").eq("store_id", STORE_ID).order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*").eq("store_id", STORE_ID),
    supabase.from("subscription_plans").select("*").eq("store_id", STORE_ID).order("meals_per_week"),
    supabase.from("expenses").select("*").eq("store_id", STORE_ID).order("date", { ascending: false }).limit(20),
  ]);

  const allOrders = (orders as any[]) || [];
  const allSubs = (subscriptions as any[]) || [];
  const allPlans = (plans as any[]) || [];
  const allExpenses = (expenses as any[]) || [];

  const totalRevenue = allOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const avgOrder = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
  const activeSubs = allSubs.filter((s) => s.status === "active").length;
  const mrr = allSubs.reduce((s, sub) => {
    const p = sub.current_price || 0;
    if (sub.billing_interval === "weekly") return s + p * 4.33;
    if (sub.billing_interval === "annual") return s + p / 12;
    return s + p;
  }, 0);
  const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  const kpis = [
    { icon: DollarSign, label: "Total Revenue", value: fmt(totalRevenue) },
    { icon: ShoppingBag, label: "Total Orders", value: allOrders.length },
    { icon: TrendingUp, label: "Avg Order Value", value: fmt(avgOrder) },
    { icon: Users, label: "Active Subs", value: activeSubs },
    { icon: CreditCard, label: "Monthly Recurring", value: fmt(mrr) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2 flex items-center gap-3">
          <DollarSign size={32} className="text-[#3d6b2a]" />
          Financials
        </h1>
        <p className="text-[#7a7060]">Revenue, expenses, and subscription metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="p-2.5 rounded-xl bg-[#E8F5E3] w-fit mb-3">
              <k.icon size={20} className="text-[#3d6b2a]" />
            </div>
            <p className="text-[#9a9080] text-sm mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Subscription Plans */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plans</h2>
        {allPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allPlans.map((plan: any) => (
              <div key={plan.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <p className="text-gray-900 font-semibold mb-3">{plan.name}</p>
                <div className="space-y-2 text-sm text-[#9a9080]">
                  <div className="flex justify-between">
                    <span>Weekly</span><span className="text-[#3d6b2a]">{fmt(plan.price_weekly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly</span><span className="text-[#3d6b2a]">{fmt(plan.price_monthly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual</span><span className="text-[#3d6b2a]">{fmt(plan.price_annual)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-[#9a9080]">{plan.meals_per_week} meals/week</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#9a9080] text-center py-8">No subscription plans configured</p>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
        {allOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 text-[#9a9080] font-medium">Order #</th>
                  <th className="pb-3 text-[#9a9080] font-medium">Type</th>
                  <th className="pb-3 text-[#9a9080] font-medium">Total</th>
                  <th className="pb-3 text-[#9a9080] font-medium">Status</th>
                  <th className="pb-3 text-[#9a9080] font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.slice(0, 10).map((o: any) => (
                  <tr key={o.id} className="border-b border-gray-200">
                    <td className="py-3 text-[#3d6b2a] font-mono text-xs">{o.order_number || o.id.slice(0, 8)}</td>
                    <td className="py-3 text-gray-700 capitalize">{o.order_type}</td>
                    <td className="py-3 text-gray-900 font-semibold">{fmt(o.total_amount)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 capitalize">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#9a9080]">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag size={32} className="mx-auto mb-3 text-[#9a9080]" />
            <p className="text-[#9a9080]">No orders yet. Financial tracking begins when customers start ordering.</p>
          </div>
        )}
      </div>

      {/* Expenses */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
        {allExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 text-[#9a9080] font-medium">Category</th>
                  <th className="pb-3 text-[#9a9080] font-medium">Description</th>
                  <th className="pb-3 text-[#9a9080] font-medium">Amount</th>
                  <th className="pb-3 text-[#9a9080] font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {allExpenses.map((e: any) => (
                  <tr key={e.id} className="border-b border-gray-200">
                    <td className="py-3 capitalize text-gray-700">{(e.category || "").replace(/_/g, " ")}</td>
                    <td className="py-3 text-[#9a9080]">{e.description || "—"}</td>
                    <td className="py-3 text-red-700 font-semibold">-{fmt(e.amount)}</td>
                    <td className="py-3 text-[#9a9080]">{new Date(e.date || e.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign size={32} className="mx-auto mb-3 text-[#9a9080]" />
            <p className="text-[#9a9080]">No expenses recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
