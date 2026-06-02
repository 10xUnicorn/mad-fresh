import { createClient as createServerClient, createServiceClient } from "@/lib/supabase/server";
import NativeMenu from "@/components/customer/NativeMenu";

export const metadata = { title: "Menu | Mad Fresh Kitchen" };
export const dynamic = "force-dynamic";

export default async function OrderMenuPage() {
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  let recipes: any[] = [];
  let fetchError: string | null = null;

  try {
    // Use service client for public menu — no auth needed, bypasses RLS/cookie issues
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("recipes")
      .select("id, name, slug, description, category, cuisine_type, image_url, base_price, is_available, is_featured, spice_level, prep_time_minutes, tags, is_sold_out")
      .eq("store_id", STORE_ID)
      .eq("is_available", true)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[OrderMenuPage] Supabase error:", error.message, error.code);
      fetchError = error.message;
    } else {
      recipes = data || [];
    }
  } catch (err: any) {
    console.error("[OrderMenuPage] Unexpected error:", err?.message);
    fetchError = err?.message || "Unknown error";
  }

  return <NativeMenu recipes={recipes} fetchError={fetchError} />;
}
