import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";
const ORG_ID = "a0000000-0000-0000-0000-000000000001";

// Allowed tables and their permitted columns (whitelist for safety)
const ALLOWED_UPDATES: Record<string, string[]> = {
  stores: [
    "name", "phone", "email",
    "address_line1", "address_line2", "city", "state", "zip_code", "country",
    "operating_hours",
    "delivery_enabled", "pickup_enabled", "delivery_radius_miles",
    "delivery_fee", "free_delivery_minimum", "delivery_days",
    "tax_rate",
  ],
  organizations: [
    "name", "timezone", "support_email", "support_phone",
  ],
};

export async function PUT(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const service = createServiceClient();
    const { data: role } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("store_id", STORE_ID)
      .eq("is_active", true)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (!role) {
      return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { table, id, data } = body as {
      table: string;
      id: string;
      data: Record<string, unknown>;
    };

    // Validate table
    if (!ALLOWED_UPDATES[table]) {
      return NextResponse.json({ error: `Invalid table: ${table}` }, { status: 400 });
    }

    // Validate record ID matches our known IDs
    if (table === "stores" && id !== STORE_ID) {
      return NextResponse.json({ error: "Invalid store ID" }, { status: 400 });
    }
    if (table === "organizations" && id !== ORG_ID) {
      return NextResponse.json({ error: "Invalid organization ID" }, { status: 400 });
    }

    // Filter to only allowed columns
    const allowedCols = ALLOWED_UPDATES[table];
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (allowedCols.includes(key)) {
        sanitized[key] = data[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Add updated_at timestamp
    sanitized.updated_at = new Date().toISOString();

    // Update using service client (bypasses RLS for admin operations)
    const { data: updated, error } = await service
      .from(table)
      .update(sanitized)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Settings update error (${table}):`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Settings API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
