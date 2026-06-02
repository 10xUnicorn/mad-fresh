import { createClient } from "@/lib/supabase/server";
import DiscountTierManager from "@/components/admin/DiscountTierManager";

export default async function DiscountsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const { data: tiers } = await supabase
    .from("volume_discount_tiers")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("min_quantity");

  return <DiscountTierManager initialTiers={(tiers as any[]) || []} />;
}
