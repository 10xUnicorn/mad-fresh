import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package, MapPin, User, CreditCard, Clock, Truck } from "lucide-react";
import { StatusBadge, PaymentStatusBadge, OrderTypeBadge } from "@/components/admin/OrderBadges";
import OrderStatusManager from "@/components/admin/OrderStatusManager";
import OrderEditor from "@/components/admin/OrderEditor";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch order
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) redirect("/admin/orders");

  // Fetch order items with recipe info
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*, recipes(name, image_url, description)")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  // Fetch delivery assignment if exists
  const { data: delivery } = await supabase
    .from("delivery_assignments")
    .select("*, driver:user_profiles(first_name, last_name, email, phone)")
    .eq("order_id", id)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const formatDate = (dateString: string | null) =>
    dateString
      ? new Date(dateString).toLocaleString("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        })
      : "—";

  // Status timeline
  const statusSteps = [
    { key: "pending", label: "Order Placed", time: order.created_at },
    { key: "confirmed", label: "Confirmed", time: order.status !== "pending" ? order.updated_at : null },
    { key: "preparing", label: "Preparing", time: order.prep_started_at },
    { key: "ready", label: "Ready", time: order.prep_completed_at },
    { key: "out_for_delivery", label: "Out for Delivery", time: order.driver_assigned_at },
    { key: "delivered", label: "Delivered", time: order.status === "delivered" ? order.updated_at : null },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm text-[#7a7060] hover:text-[#4a5e3a] mb-2 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Orders
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-[#1e2d18]">Order #{order.order_number}</h1>
            <StatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
            <OrderTypeBadge type={order.order_type} />
          </div>
          <p className="text-[#7a7060] text-sm mt-1">Placed {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column — Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          {order.status !== "cancelled" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-[#3d6b2a]" /> Order Timeline
              </h2>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, i) => {
                  const isComplete = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex-1 text-center relative">
                      {i > 0 && (
                        <div
                          className={`absolute top-4 right-1/2 w-full h-0.5 -z-10 ${
                            isComplete ? "bg-[#3d6b2a]" : "bg-gray-200"
                          }`}
                        />
                      )}
                      <div
                        className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                          isCurrent
                            ? "bg-[#3d6b2a] text-white ring-4 ring-[#E8F5E3]"
                            : isComplete
                            ? "bg-[#3d6b2a] text-white"
                            : "bg-gray-200 text-[#7a7060]"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <p className={`text-xs mt-2 font-medium ${isCurrent ? "text-[#3d6b2a]" : isComplete ? "text-gray-700" : "text-[#7a7060]"}`}>
                        {step.label}
                      </p>
                      {step.time && isComplete && (
                        <p className="text-[10px] text-[#7a7060] mt-0.5">
                          {new Date(step.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-[#3d6b2a]" /> Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#9a9080] font-medium mb-1">Name</p>
                <p className="text-sm font-semibold text-gray-900">{order.customer_name || "Guest"}</p>
              </div>
              <div>
                <p className="text-xs text-[#9a9080] font-medium mb-1">Email</p>
                <p className="text-sm text-gray-700">{order.customer_email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#9a9080] font-medium mb-1">Phone</p>
                <p className="text-sm text-gray-700">{order.customer_phone || "—"}</p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          {order.delivery_address && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#3d6b2a]" /> Delivery Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#9a9080] font-medium mb-1">Address</p>
                  <p className="text-sm text-gray-900">
                    {typeof order.delivery_address === "object"
                      ? `${(order.delivery_address as any).street || ""}, ${(order.delivery_address as any).city || ""} ${(order.delivery_address as any).state || ""} ${(order.delivery_address as any).zip || ""}`
                      : String(order.delivery_address)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9a9080] font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{order.delivery_notes || "None"}</p>
                </div>
              </div>

              {/* Driver Info */}
              {delivery && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck size={16} className="text-[#3d6b2a]" />
                    <p className="text-sm font-semibold text-gray-900">Delivery Assignment</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-[#9a9080]">Driver</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(delivery as any).driver?.first_name} {(delivery as any).driver?.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9a9080]">Status</p>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div>
                      <p className="text-xs text-[#9a9080]">Assigned</p>
                      <p className="text-sm text-gray-700">{formatDate(delivery.assigned_at)}</p>
                    </div>
                    {delivery.delivered_at && (
                      <div>
                        <p className="text-xs text-[#9a9080]">Delivered</p>
                        <p className="text-sm text-gray-700">{formatDate(delivery.delivered_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Editor — Edit items, amounts, refunds */}
          <OrderEditor
            orderId={order.id}
            orderNumber={order.order_number}
            items={(orderItems || []).map((item: any) => ({
              id: item.id,
              recipe_id: item.recipe_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              special_instructions: item.special_instructions,
              recipe_name: item.recipes?.name || "Unknown Item",
              recipe_image: item.recipes?.image_url,
              portion_size: item.portion_size,
            }))}
            subtotal={order.subtotal || order.items_subtotal || 0}
            taxAmount={order.tax_amount || 0}
            deliveryFee={order.delivery_fee || 0}
            tipAmount={order.tip_amount || 0}
            discountAmount={order.discount_amount || 0}
            totalAmount={order.total_amount || 0}
            paymentStatus={order.payment_status}
            stripePaymentIntentId={order.stripe_payment_intent_id}
          />

          {/* Order Items */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package size={18} className="text-[#3d6b2a]" /> Order Items
              </h2>
            </div>
            {orderItems && orderItems.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#9a9080] uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.recipes?.image_url && (
                            <img
                              src={item.recipes.image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.recipes?.name || "Unknown Item"}
                            </p>
                            {item.portion_size && (
                              <p className="text-xs text-[#9a9080]">{item.portion_size}</p>
                            )}
                            {item.customization_notes && (
                              <p className="text-xs text-[#7a7060] italic">{item.customization_notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-[#9a9080] text-sm">No items recorded</div>
            )}

            {/* Cost Breakdown */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="max-w-xs ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9a9080]">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9a9080]">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#9a9080]">Delivery Fee</span>
                  <span className="text-gray-900">{formatCurrency(order.delivery_fee || 0)}</span>
                </div>
                {(order.tip_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9a9080]">Tip</span>
                    <span className="text-gray-900">{formatCurrency(order.tip_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#3d6b2a]">{formatCurrency(order.total_amount || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {order.stripe_payment_intent_id && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={18} className="text-[#3d6b2a]" /> Payment
              </h2>
              <p className="text-sm text-[#9a9080]">
                Stripe Payment Intent:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700">
                  {order.stripe_payment_intent_id}
                </code>
              </p>
            </div>
          )}
        </div>

        {/* Right Column — Status Manager */}
        <div>
          <OrderStatusManager
            orderId={order.id}
            currentStatus={order.status}
            currentAdminNotes={order.admin_notes || ""}
            currentAssignedDriverId={order.assigned_driver_id || undefined}
          />
        </div>
      </div>
    </div>
  );
}
