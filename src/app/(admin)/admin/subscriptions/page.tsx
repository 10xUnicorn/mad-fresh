import { createClient } from "@/lib/supabase/server";
import SubscriptionManager from "@/components/admin/SubscriptionManager";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const [{ data: plans }, { data: subscribers }] = await Promise.all([
    supabase.from("subscription_plans").select("*").eq("store_id", STORE_ID).order("sort_order"),
    supabase.from("subscriptions").select("*").eq("store_id", STORE_ID).order("created_at", { ascending: false }),
  ]);

  return (
    <SubscriptionManager
      initialPlans={(plans as any[]) || []}
      initialSubscribers={(subscribers as any[]) || []}
    />
  );
}
