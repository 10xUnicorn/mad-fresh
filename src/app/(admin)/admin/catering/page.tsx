import { createClient } from "@/lib/supabase/server";
import CateringPageTabs from "@/components/admin/CateringPageTabs";
import { UtensilsCrossed } from "lucide-react";

export default async function CateringPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let packages: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orders: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contracts: any[] = [];

  try {
    const [pkgRes, ordRes, contractRes] = await Promise.all([
      supabase.from("catering_packages").select("*").eq("store_id", STORE_ID).order("sort_order"),
      supabase
        .from("catering_orders")
        .select("id, order_number, event_name, event_date, event_time, contact_name, contact_email, contact_phone, venue_name, venue_address, estimated_guests, final_guest_count, total_amount, status, created_at, order_type, school_name, company_name, is_recurring, contract_start_date, contract_end_date")
        .eq("store_id", STORE_ID)
        .order("created_at", { ascending: false }),
      supabase
        .from("catering_contracts")
        .select("*")
        .eq("store_id", STORE_ID)
        .order("created_at", { ascending: false }),
    ]);

    packages = (pkgRes.data as typeof packages) || [];
    orders = (ordRes.data as typeof orders) || [];
    contracts = (contractRes.data as typeof contracts) || [];

    if (pkgRes.error) console.error("Error fetching catering packages:", pkgRes.error);
    if (ordRes.error) console.error("Error fetching catering orders:", ordRes.error);
    if (contractRes.error) console.error("Error fetching contracts:", contractRes.error);
  } catch (err) {
    console.error("Error loading catering data:", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-1 flex items-center gap-3">
          <UtensilsCrossed size={32} className="text-[#3d6b2a]" />
          Catering
        </h1>
        <p className="text-[#7a7060]">Manage packages, orders, and contracts</p>
      </div>
      <CateringPageTabs
        initialPackages={packages}
        initialOrders={orders}
        initialContracts={contracts}
      />
    </div>
  );
}
