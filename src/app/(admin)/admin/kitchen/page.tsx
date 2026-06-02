"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/admin/OrderBadges";
import { ChefHat, Clock, CheckCircle2, ArrowRight, RefreshCw, Loader2 } from "lucide-react";

interface KitchenOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  order_type: string;
  created_at: string;
  prep_started_at: string | null;
  prep_completed_at: string | null;
  delivery_notes: string | null;
  admin_notes: string | null;
  items: {
    id: string;
    quantity: number;
    portion_size: string | null;
    customization_notes: string | null;
    recipe_name: string;
  }[];
}

export default function KitchenPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const fetchOrders = useCallback(async () => {
    // Fetch orders that are confirmed or preparing (active kitchen queue)
    const { data: orderData, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, status, order_type, created_at, prep_started_at, prep_completed_at, delivery_notes, admin_notes")
      .eq("store_id", STORE_ID)
      .in("status", ["confirmed", "preparing", "ready"])
      .order("created_at", { ascending: true });

    if (error || !orderData) {
      setLoading(false);
      return;
    }

    // Fetch items for these orders
    const orderIds = orderData.map((o) => o.id);
    const { data: itemData } = await supabase
      .from("order_items")
      .select("id, order_id, quantity, portion_size, customization_notes, recipes(name)")
      .in("order_id", orderIds);

    const enriched: KitchenOrder[] = orderData.map((order) => ({
      ...order,
      items: (itemData || [])
        .filter((item: any) => item.order_id === order.id)
        .map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          portion_size: item.portion_size,
          customization_notes: item.customization_notes,
          recipe_name: item.recipes?.name || "Unknown",
        })),
    }));

    setOrders(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "confirmed" ? "preparing" : currentStatus === "preparing" ? "ready" : null;
    if (!nextStatus) return;

    setUpdating(orderId);

    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.ok) {
      await fetchOrders();
    }
    setUpdating(null);
  };

  const getElapsedTime = (dateString: string) => {
    const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] flex items-center gap-3">
            <ChefHat size={32} className="text-[#3d6b2a]" /> Kitchen Queue
          </h1>
          <p className="text-[#7a7060] mt-1">
            {orders.length} active order{orders.length !== 1 ? "s" : ""} in the queue
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchOrders(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Column */}
        <KanbanColumn
          title="Queue"
          subtitle="Waiting to prep"
          icon={<Clock size={18} className="text-yellow-600" />}
          count={confirmedOrders.length}
          headerColor="bg-yellow-50 border-yellow-200"
        >
          {confirmedOrders.map((order) => (
            <KitchenCard
              key={order.id}
              order={order}
              onAdvance={() => advanceStatus(order.id, order.status)}
              advanceLabel="Start Prep"
              isUpdating={updating === order.id}
              elapsed={getElapsedTime(order.created_at)}
            />
          ))}
        </KanbanColumn>

        {/* Preparing Column */}
        <KanbanColumn
          title="Preparing"
          subtitle="In the kitchen"
          icon={<ChefHat size={18} className="text-orange-600" />}
          count={preparingOrders.length}
          headerColor="bg-orange-50 border-orange-200"
        >
          {preparingOrders.map((order) => (
            <KitchenCard
              key={order.id}
              order={order}
              onAdvance={() => advanceStatus(order.id, order.status)}
              advanceLabel="Mark Ready"
              isUpdating={updating === order.id}
              elapsed={order.prep_started_at ? getElapsedTime(order.prep_started_at) : "—"}
            />
          ))}
        </KanbanColumn>

        {/* Ready Column */}
        <KanbanColumn
          title="Ready"
          subtitle="Waiting for pickup/delivery"
          icon={<CheckCircle2 size={18} className="text-green-600" />}
          count={readyOrders.length}
          headerColor="bg-green-50 border-green-200"
        >
          {readyOrders.map((order) => (
            <KitchenCard
              key={order.id}
              order={order}
              elapsed={order.prep_completed_at ? getElapsedTime(order.prep_completed_at) : "—"}
            />
          ))}
        </KanbanColumn>
      </div>

      {orders.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <ChefHat size={48} className="mx-auto mb-4 text-[#7a7060]" />
          <p className="text-[#9a9080] text-lg font-medium">Kitchen is clear</p>
          <p className="text-[#7a7060] text-sm mt-1">No orders in the queue right now</p>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  title, subtitle, icon, count, headerColor, children,
}: {
  title: string; subtitle: string; icon: React.ReactNode; count: number;
  headerColor: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      <div className={`px-5 py-4 border-b ${headerColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
            {count}
          </span>
        </div>
        <p className="text-xs text-[#9a9080] mt-1">{subtitle}</p>
      </div>
      <div className="p-4 space-y-3 min-h-[200px]">{children}</div>
    </div>
  );
}

function KitchenCard({
  order, onAdvance, advanceLabel, isUpdating, elapsed,
}: {
  order: KitchenOrder; onAdvance?: () => void; advanceLabel?: string;
  isUpdating?: boolean; elapsed: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">#{order.order_number}</p>
          <p className="text-xs text-[#9a9080]">{order.customer_name || "Guest"}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={order.status} />
          <p className="text-[10px] text-[#7a7060] mt-1">{elapsed}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-700">
              <span className="font-bold text-[#3d6b2a]">{item.quantity}x</span> {item.recipe_name}
              {item.portion_size && <span className="text-[#7a7060] ml-1">({item.portion_size})</span>}
            </span>
          </div>
        ))}
        {order.items.length === 0 && (
          <p className="text-xs text-[#7a7060] italic">No items listed</p>
        )}
      </div>

      {/* Notes */}
      {(order.admin_notes || order.delivery_notes) && (
        <div className="text-xs bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 mb-3 text-yellow-800">
          {order.admin_notes || order.delivery_notes}
        </div>
      )}

      {/* Advance Button */}
      {onAdvance && advanceLabel && (
        <button
          onClick={onAdvance}
          disabled={isUpdating}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              {advanceLabel} <ArrowRight size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
