import { createClient } from "@/lib/supabase/server";
import CouponManager from "@/components/admin/CouponManager";
import { Percent } from "lucide-react";

export default async function CouponsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] flex items-center gap-3">
          <Percent size={32} className="text-[#3d6b2a]" />
          Coupons & Promotions
        </h1>
        <p className="text-[#7a7060] mt-2">Create and manage discount codes for your store</p>
      </div>
      <CouponManager initialCoupons={(coupons as any[]) || []} />
    </div>
  );
}
