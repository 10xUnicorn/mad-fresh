import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// GET: Fetch active menu items for public use (compact menu, add-items, etc.)
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("id, name, base_price, image_url, category, description, is_featured, is_available, spice_level, prep_time_minutes, tags, is_sold_out")
      .eq("store_id", STORE_ID)
      .eq("is_available", true)
      .order("is_featured", { ascending: false })
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(recipes || []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}
