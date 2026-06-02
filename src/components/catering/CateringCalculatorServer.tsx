import { createClient } from "@/lib/supabase/server";
import CateringCalculator, { ServiceLevel } from "./CateringCalculator";

const DEFAULT_SERVICE_LEVELS: ServiceLevel[] = [
  { name: "Corporate Fuel", price: 15, min: 10 },
  { name: "Event Spread", price: 25, min: 25 },
  { name: "Premium Experience", price: 45, min: 50 },
];

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export default async function CateringCalculatorServer() {
  let serviceLevels = DEFAULT_SERVICE_LEVELS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("catering_service_levels")
      .select("name, price_per_person, min_guests")
      .eq("store_id", STORE_ID)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      serviceLevels = data.map((row: any) => ({
        name: row.name,
        price: Number(row.price_per_person),
        min: row.min_guests,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch catering service levels:", error);
  }

  return <CateringCalculator serviceLevels={serviceLevels} />;
}
