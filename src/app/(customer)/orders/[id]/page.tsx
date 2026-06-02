import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Clock, MapPin, CreditCard, RefreshCw, ShoppingBag } from "lucide-react";
import ReorderButton from "@/components/customer/ReorderButton";
import OrderModifier from "@/components/customer/OrderModifier";
import OrderTimeline from "@/components/customer/OrderTimeline";

export const metadata = { title: "Order Details | Mad Fresh Kitchen" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/orders");

  // Fetch order — support both UUID and order number (MF-xxxx)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq(isUuid ? "id" : "order_number", id)
    .single();

  if (error || !order) notFound();

  const orderId = order.id;

  // Fetch order items with recipe details
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*, recipes(name, image_url, category)")
    .eq("order_id", orderId);

  // Status info used by the OrderTimeline component
  const orderStatus = order.status as string;
  const orderFulfillment = (order.fulfillment_type as string) || "pickup";

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/orders" className="text-[#7a7060] hover:text-[#1e2d18] text-sm flex items-center gap-1 mb-4 transition">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1e2d18]">{order.order_number}</h1>
            <p className="text-[#7a7060] text-sm mt-1">
              Placed {new Date(order.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {orderItems && orderItems.length > 0 && (
            <ReorderButton items={orderItems.map((item: Record<string, unknown>) => ({
              recipe_id: item.recipe_id as string,
              name: (item.recipes as Record<string, unknown>)?.name as string || "Item",
              price: Number(item.unit_price),
              quantity: Number(item.quantity),
              fulfillment_type: order.fulfillment_type,
            }))} />
          )}
        </div>
      </div>

      {/* Amazon-style Status Timeline */}
      {orderStatus !== "cancelled" && orderStatus !== "refunded" && (
        <OrderTimeline
          status={orderStatus}
          fulfillmentType={orderFulfillment}
          createdAt={order.created_at}
          updatedAt={order.updated_at}
        />
      )}

      {/* Cancelled/Refunded Banner */}
      {(order.status === "cancelled" || order.status === "refunded") && (
        <div className={`rounded-xl p-4 border ${
          order.status === "refunded" ? "bg-gray-100 border-gray-300" : "bg-red-50 border-red-200"
        }`}>
          <p className={`font-semibold ${order.status === "refunded" ? "text-[#4a5e3a]" : "text-red-600"}`}>
            This order has been {order.status}.
          </p>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white border border-[#ddd8cc] rounded-xl overflow-hidden">
        <div className="p-6 pb-4">
          <h2 className="text-[#1e2d18] font-bold">Items Ordered</h2>
        </div>
        <div className="divide-y divide-[#ede9e2]">
          {orderItems && orderItems.length > 0 ? (
            orderItems.map((item: Record<string, unknown>) => {
              const recipe = item.recipes as Record<string, unknown> | null;
              return (
                <div key={item.id as string} className="flex items-center gap-4 px-6 py-4">
                  {recipe?.image_url ? (
                    <img src={recipe.image_url as string} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#f2efe8] flex items-center justify-center">
                      <ShoppingBag size={20} className="text-[#9a9080]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1e2d18] font-semibold text-sm">{recipe?.name as string || "Item"}</p>
                    <p className="text-[#9a9080] text-xs">Qty: {item.quantity as number}</p>
                  </div>
                  <p className="text-[#1e2d18] font-semibold">${Number(item.total_price).toFixed(2)}</p>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-8 text-center text-[#7a7060] text-sm">Order items not available</div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white border border-[#ddd8cc] rounded-xl p-6 space-y-3">
        <h2 className="text-[#1e2d18] font-bold mb-4">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-[#7a7060]">Subtotal</span>
          <span className="text-[#1e2d18]">${Number(order.items_subtotal).toFixed(2)}</span>
        </div>
        {Number(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#7a7060]">Discount</span>
            <span className="text-[#3d6b2a]">-${Number(order.discount_amount).toFixed(2)}</span>
          </div>
        )}
        {Number(order.delivery_fee) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#7a7060]">Delivery Fee</span>
            <span className="text-[#1e2d18]">${Number(order.delivery_fee).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-[#7a7060]">Tax</span>
          <span className="text-[#1e2d18]">${Number(order.tax_amount).toFixed(2)}</span>
        </div>
        {Number(order.tip_amount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#7a7060]">Tip</span>
            <span className="text-[#1e2d18]">${Number(order.tip_amount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-[#ddd8cc]">
          <span className="text-[#1e2d18] font-bold">Total</span>
          <span className="text-[#3d6b2a] font-bold text-lg">${Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Post-Order Modifications: Tip + Add Items */}
      <OrderModifier orderId={orderId} variant="full" />

      {/* Fulfillment + Payment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            {order.fulfillment_type === "delivery" ? <Package size={18} className="text-[#3d6b2a]" /> : <Clock size={18} className="text-[#3d6b2a]" />}
            <h3 className="text-[#1e2d18] font-semibold text-sm">{order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"}</h3>
          </div>
          {order.scheduled_for && (
            <p className="text-[#7a7060] text-sm">
              Scheduled: {new Date(order.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {order.pickup_time ? ` · ${order.pickup_time}` : ""}
            </p>
          )}
        </div>

        <div className="bg-white border border-[#ddd8cc] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-[#3d6b2a]" />
            <h3 className="text-[#1e2d18] font-semibold text-sm">Payment</h3>
          </div>
          <p className="text-[#7a7060] text-sm capitalize">
            {order.payment_method || "Card"} · <span className={
              order.payment_status === "paid" ? "text-green-600" :
              order.payment_status === "refunded" ? "text-[#7a7060]" : "text-yellow-600"
            }>{order.payment_status}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
