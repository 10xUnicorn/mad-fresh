import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

const CUSTOMER_CATEGORIES = [
  "order_confirmation",
  "order_status",
  "subscription",
  "rewards",
  "marketing",
];

// GET — Return current user's notification preferences
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("user_notification_preferences")
    .select("category, enabled")
    .eq("user_id", user.id)
    .eq("store_id", STORE_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build preferences map — default all to enabled
  const preferences: Record<string, boolean> = {};
  for (const cat of CUSTOMER_CATEGORIES) {
    const found = data?.find((p) => p.category === cat);
    preferences[cat] = found ? found.enabled : true;
  }

  return NextResponse.json({ preferences });
}

// PUT — Update preferences
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { preferences } = body as {
    preferences: Record<string, boolean>;
  };

  if (!preferences || typeof preferences !== "object") {
    return NextResponse.json({ error: "Invalid preferences format" }, { status: 400 });
  }

  const service = createServiceClient();

  // Upsert each preference
  const upserts = Object.entries(preferences)
    .filter(([category]) => CUSTOMER_CATEGORIES.includes(category))
    .map(([category, enabled]) => ({
      user_id: user.id,
      store_id: STORE_ID,
      category,
      enabled,
    }));

  if (upserts.length === 0) {
    return NextResponse.json({ error: "No valid categories provided" }, { status: 400 });
  }

  const { error } = await service
    .from("user_notification_preferences")
    .upsert(upserts, { onConflict: "user_id,store_id,category" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, preferences });
}
