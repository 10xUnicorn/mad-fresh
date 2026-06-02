import { createClient } from "@/lib/supabase/server";
import VendorManager from "@/components/admin/VendorManager";

export default async function VendorsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("name", { ascending: true });

  return <VendorManager initialVendors={vendors || []} />;
}
