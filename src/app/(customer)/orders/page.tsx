import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Package, Clock, ChevronRight } from "lucide-react";
import OrderListClient from "@/components/customer/OrderListClient";

export const metadata = { title: "My Orders | Mad Fresh Kitchen" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, payment_status, created_at, fulfillment_type, items_subtotal, delivery_fee, tax_amount, discount_amount, order_type")
    .eq("store_id", "b0000000-0000-0000-0000-000000000001")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1e2d18]">My Orders</h1>
          <p className="text-[#7a7060] mt-1">{orders?.length || 0} orders</p>
        </div>
        <Link href="/order" className="px-4 py-2 min-h-[44px] bg-[#3d6b2a] text-white font-semibold rounded-lg text-sm hover:bg-[#2f5720] transition">
          Order Again
        </Link>
      </div>

      {orders && orders.length > 0 ? (
        <OrderListClient orders={orders} />
      ) : (
        <div className="bg-white border border-[#ddd8cc] rounded-2xl p-12 text-center">
          <ShoppingBag size={48} className="text-[#9a9080] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1e2d18] mb-2">No orders yet</h2>
          <p className="text-[#7a7060] mb-6">Your order history will appear here after your first purchase.</p>
          <Link href="/order" className="px-6 py-3 min-h-[44px] bg-[#3d6b2a] text-white font-semibold rounded-xl hover:bg-[#2f5720] transition inline-block">
            Browse Menu
          </Link>
        </div>
      )}
    </div>
  );
}
