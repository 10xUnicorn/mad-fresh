import { createClient } from "@/lib/supabase/server";
import VolumeDiscountCalculator, { PriceTier } from "./VolumeDiscountCalculator";

const DEFAULT_TIERS: PriceTier[] = [
  { min_quantity: 1, max_quantity: 9, price_per_unit: 14.99, discount_percent: 0, label: "Individual" },
  { min_quantity: 10, max_quantity: 24, price_per_unit: 13.49, discount_percent: 10, label: "Small Group" },
  { min_quantity: 25, max_quantity: 49, price_per_unit: 12.74, discount_percent: 15, label: "Team" },
  { min_quantity: 50, max_quantity: 99, price_per_unit: 11.99, discount_percent: 20, label: "Department" },
  { min_quantity: 100, max_quantity: 199, price_per_unit: 10.49, discount_percent: 30, label: "Company" },
  { min_quantity: 200, max_quantity: null, price_per_unit: 8.99, discount_percent: 40, label: "Enterprise" },
];

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export default async function VolumeDiscountCalculatorServer() {
  let tiers = DEFAULT_TIERS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("volume_discount_tiers")
      .select("min_quantity, max_quantity, price_per_unit, discount_percent, label")
      .eq("store_id", STORE_ID)
      .order("min_quantity", { ascending: true });

    if (!error && data && data.length > 0) {
      tiers = data as PriceTier[];
    }
  } catch (error) {
    console.error("Failed to fetch volume discount tiers:", error);
    // Fall back to default tiers
  }

  return <VolumeDiscountCalculator tiers={tiers} />;
}
