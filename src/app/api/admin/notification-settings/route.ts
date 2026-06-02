import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

/** Verify the caller is an admin */
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: role } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  return role ? user : null;
}

// GET — List all BCC settings for the store
export async function GET() {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("admin_notification_settings")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

// POST — Add new BCC recipient
export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bcc_email, label, categories } = body as {
    bcc_email: string;
    label: string;
    categories?: string[];
  };

  if (!bcc_email || !label) {
    return NextResponse.json({ error: "Email and label are required" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bcc_email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("admin_notification_settings")
    .insert({
      store_id: STORE_ID,
      bcc_email,
      label,
      categories: categories || [
        "order_confirmation", "order_status", "subscription",
        "rewards", "marketing", "catering", "account", "system",
      ],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ setting: data }, { status: 201 });
}

// PUT — Update categories/active status for a BCC recipient
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, categories, is_active, label } = body as {
    id: string;
    categories?: string[];
    is_active?: boolean;
    label?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "Setting ID is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (categories !== undefined) updates.categories = categories;
  if (is_active !== undefined) updates.is_active = is_active;
  if (label !== undefined) updates.label = label;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("admin_notification_settings")
    .update(updates)
    .eq("id", id)
    .eq("store_id", STORE_ID)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ setting: data });
}

// DELETE — Remove a BCC recipient
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Setting ID is required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("admin_notification_settings")
    .delete()
    .eq("id", id)
    .eq("store_id", STORE_ID);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
