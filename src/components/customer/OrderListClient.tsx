"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Clock, ChevronRight, RefreshCw, Loader } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  fulfillment_type: string;
  order_type: string;
}

interface OrderListClientProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  preparing: "bg-orange-50 text-orange-700",
  ready: "bg-[#e9f0e4] text-[#3d6b2a]",
  out_for_delivery: "bg-purple-50 text-purple-700",
  delivered: "bg-[#e9f0e4] text-[#3d6b2a]",
  completed: "bg-[#e9f0e4] text-[#3d6b2a]",
  cancelled: "bg-red-50 text-red-700",
  refunded: "bg-gray-100 text-[#9a9080]",
};

const paymentColors: Record<string, string> = {
  paid: "text-[#3d6b2a]",
  pending: "text-amber-700",
  failed: "text-red-600",
  refunded: "text-[#9a9080]",
  partially_refunded: "text-orange-600",
};

export default function OrderListClient({ orders }: OrderListClientProps) {
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const router = useRouter();

  const filteredOrders = filter === "all" ? orders : orders.filter(o => {
    if (filter === "active") return ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status);
    if (filter === "completed") return ["delivered", "completed"].includes(o.status);
    if (filter === "cancelled") return ["cancelled", "refunded"].includes(o.status);
    return true;
  });

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const res = await fetch("/api/dashboard/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.cart && data.cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(data.cart));
        router.push("/menu");
      }
    } catch {
      // silently fail
    }
    setReorderingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {["all", "active", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition min-h-[44px] flex items-center ${
              filter === f ? "bg-[#3d6b2a] text-white" : "bg-[#f2efe8] text-[#7a7060] hover:bg-[#f2efe8]"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-[#ddd8cc] rounded-xl p-5 hover:border-[#3d6b2a]/20 transition">
              <Link href={`/orders/${order.id}`} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f2efe8] flex items-center justify-center">
                    {order.fulfillment_type === "delivery" ? <Package size={20} className="text-[#7a7060]" /> : <Clock size={20} className="text-[#7a7060]" />}
                  </div>
                  <div>
                    <p className="text-[#1e2d18] font-bold">{order.order_number}</p>
                    <p className="text-[#9a9080] text-sm">
                      {new Date(order.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[#1e2d18] font-bold">${Number(order.total_amount).toFixed(2)}</p>
                    <span className={`text-xs font-medium ${paymentColors[order.payment_status] || "text-[#7a7060]"}`}>
                      {order.payment_status}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${statusColors[order.status] || "bg-gray-100 text-[#9a9080]"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <ChevronRight size={18} className="text-[#9a9080] hidden sm:block" />
                </div>
              </Link>
              {/* Reorder button for completed orders */}
              {["delivered", "completed"].includes(order.status) && (
                <div className="mt-3 pt-3 border-t border-[#ede9e2] flex justify-end">
                  <button
                    onClick={() => handleReorder(order.id)}
                    disabled={reorderingId === order.id}
                    className="text-xs font-semibold text-[#3d6b2a] hover:text-[#1e2d18] flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {reorderingId === order.id ? (
                      <><Loader size={12} className="animate-spin" /> Loading...</>
                    ) : (
                      <><RefreshCw size={12} /> Reorder</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-8 text-center">
          <p className="text-[#7a7060] text-sm">No {filter !== "all" ? filter : ""} orders found</p>
        </div>
      )}
    </div>
  );
}
