import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// Whitelist of fields that can be updated on contacts
const ALLOWED_CONTACT_FIELDS: string[] = [
  // Personal Info
  "first_name", "last_name", "email", "phone", "birthday",
  "address_line1", "address_line2", "city", "state", "zip_code",
  // Subscription & Meal Preferences
  "subscription_status", "subscription_plan_id", "subscription_meal_size",
  "subscription_cuisines", "dietary_preferences", "allergens",
  // Communication & Preferences
  "is_newsletter_subscribed", "preferred_delivery_day", "preferred_delivery_time",
  "auto_order_enabled", "quick_purchase_enabled", "notes", "last_contacted_at",
  // Tags & Classification
  "contact_type", "tags", "lead_score", "food_personality_type", "source",
];

async function verifyAdmin(supabase: ReturnType<typeof createServiceClient>) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  return role ? user : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = createServiceClient();
    const user = await verifyAdmin(service);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contact, error } = await service
      .from("contacts")
      .select("*")
      .eq("id", id)
      .eq("store_id", STORE_ID)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ data: contact });
  } catch (err) {
    console.error("Contact GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = createServiceClient();
    const user = await verifyAdmin(service);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Confirm contact belongs to this store
    const { data: existing } = await service
      .from("contacts")
      .select("id, store_id")
      .eq("id", id)
      .eq("store_id", STORE_ID)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json();

    // Filter to only whitelisted fields
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (ALLOWED_CONTACT_FIELDS.includes(key)) {
        sanitized[key] = body[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    sanitized.updated_at = new Date().toISOString();

    const { data: updated, error } = await service
      .from("contacts")
      .update(sanitized)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Contact update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Contact PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
