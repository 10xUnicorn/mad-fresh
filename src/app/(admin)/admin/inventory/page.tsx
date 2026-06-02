import { createClient } from "@/lib/supabase/server";
import { Package, AlertTriangle, DollarSign, ShoppingCart, FileText, Plus } from "lucide-react";

export default async function InventoryPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  let stockAlerts: any[] = [];
  let purchaseOrders: any[] = [];
  let totalItems = 0;
  let estimatedValue = 0;

  try {
    // Fetch ingredient stock alerts (where current_stock < reorder_point)
    const { data: invData } = await supabase
      .from("inventory")
      .select("*, ingredients(id, name, category, cost_per_unit)")
      .eq("store_id", STORE_ID);

    if (invData) {
      stockAlerts = invData
        .filter((inv: any) => inv.current_stock < (inv.reorder_point || 0))
        .sort((a: any, b: any) => a.current_stock - b.current_stock)
        .slice(0, 10);

      totalItems = invData.length;
      estimatedValue = invData.reduce((sum: number, inv: any) => {
        const costPerUnit = inv.ingredients?.cost_per_unit || 0;
        return sum + costPerUnit * (inv.current_stock || 0);
      }, 0);
    }

    // Fetch recent purchase orders
    const { data: posData } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("store_id", STORE_ID)
      .order("created_at", { ascending: false })
      .limit(10);

    purchaseOrders = (posData as any[]) || [];
  } catch (err) {
    console.error("Error loading inventory data:", err);
  }

  const lowStockAlerts = stockAlerts.length;
  const pendingPOs = purchaseOrders.filter((po: any) => po.status === "pending").length;
  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2 flex items-center gap-3">
          <Package size={32} className="text-[#3d6b2a]" />
          Inventory & Supplies
        </h1>
        <p className="text-[#7a7060]">Equipment, packaging, and operational inventory management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Total Items", value: totalItems },
          { icon: AlertTriangle, label: "Low Stock Alerts", value: lowStockAlerts, alert: lowStockAlerts > 0 },
          { icon: ShoppingCart, label: "Pending POs", value: pendingPOs },
          { icon: DollarSign, label: "Est. Value", value: fmt(estimatedValue) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
            <div className="p-2.5 rounded-xl bg-[#E8F5E3] w-fit mb-3">
              <s.icon size={20} className={s.alert ? "text-red-600" : "text-[#3d6b2a]"} />
            </div>
            <p className="text-[#9a9080] text-sm mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ingredient Stock Alerts */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-orange-500" /> Ingredient Stock Alerts
        </h2>
        {stockAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[#9a9080]">Ingredient</th>
                  <th className="px-4 py-3 text-left font-medium text-[#9a9080]">Category</th>
                  <th className="px-4 py-3 text-center font-medium text-[#9a9080]">Current Stock</th>
                  <th className="px-4 py-3 text-center font-medium text-[#9a9080]">Reorder Point</th>
                  <th className="px-4 py-3 text-right font-medium text-[#9a9080]">Cost/Unit</th>
                </tr>
              </thead>
              <tbody>
                {stockAlerts.map((alert: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{alert.ingredients?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-[#9a9080] capitalize">{alert.ingredients?.category || "-"}</td>
                    <td className="px-4 py-3 text-center text-gray-900 font-semibold">{alert.current_stock || 0}</td>
                    <td className="px-4 py-3 text-center text-orange-600 font-semibold">{alert.reorder_point || 0}</td>
                    <td className="px-4 py-3 text-right text-[#9a9080]">{fmt(alert.ingredients?.cost_per_unit || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#9a9080] text-center py-8">All ingredient stock levels are healthy</p>
        )}
      </div>

      {/* Purchase Orders Summary */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingCart size={20} className="text-[#3d6b2a]" /> Purchase Orders
        </h2>
        {purchaseOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-[#9a9080]">PO #</th>
                  <th className="px-4 py-3 text-left font-medium text-[#9a9080]">Vendor</th>
                  <th className="px-4 py-3 text-center font-medium text-[#9a9080]">Items</th>
                  <th className="px-4 py-3 text-right font-medium text-[#9a9080]">Total Amount</th>
                  <th className="px-4 py-3 text-center font-medium text-[#9a9080]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[#9a9080]">Delivery Date</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{po.po_number || `PO-${po.id?.slice(0, 8)}`}</td>
                    <td className="px-4 py-3 text-[#9a9080]">{po.vendor_name || "-"}</td>
                    <td className="px-4 py-3 text-center text-gray-900">{po.item_count || 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(po.total_amount || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        po.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        po.status === "delivered" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {po.status?.charAt(0).toUpperCase() + po.status?.slice(1) || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9a9080]">
                      {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#9a9080] text-center py-8">No purchase orders found</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors">
            <Plus size={18} />
            Create Purchase Order
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors">
            <Package size={18} />
            Run Stock Count
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors">
            <FileText size={18} />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
