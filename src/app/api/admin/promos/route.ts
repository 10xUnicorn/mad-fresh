import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: roleData } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .single();

  if (!roleData || !["super_admin", "admin", "manager"].includes(roleData.role)) return null;
  return user;
}

// GET: List all promos
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from("promotions")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: Create promo
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, displayTitle, description, code, type, value,
    minOrderAmount, maxDiscountAmount, maxUsesTotal, maxUsesPerUser,
    appliesTo, startDate, endDate, isActive, showOnWebsite
  } = body;

  if (!name || !code || !type || value === undefined) {
    return NextResponse.json({ error: "Name, code, type, and value are required" }, { status: 400 });
  }

  const service = createServiceClient();

  // Check for duplicate code
  const { data: existing } = await service
    .from("promotions")
    .select("id")
    .eq("store_id", STORE_ID)
    .ilike("code", code.toUpperCase())
    .single();

  if (existing) {
    return NextResponse.json({ error: "A promo with this code already exists" }, { status: 409 });
  }

  const { data, error } = await service
    .from("promotions")
    .insert({
      store_id: STORE_ID,
      name,
      display_title: displayTitle || null,
      description: description || null,
      code: code.toUpperCase(),
      type,
      value,
      min_order_amount: minOrderAmount || null,
      max_discount_amount: maxDiscountAmount || null,
      max_uses_total: maxUsesTotal || null,
      max_uses_per_user: maxUsesPerUser || 1,
      applies_to: appliesTo || "all",
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: isActive ?? true,
      show_on_website: showOnWebsite ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT: Update promo
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  const fieldMap: Record<string, string> = {
    name: "name",
    displayTitle: "display_title",
    description: "description",
    code: "code",
    type: "type",
    value: "value",
    minOrderAmount: "min_order_amount",
    maxDiscountAmount: "max_discount_amount",
    maxUsesTotal: "max_uses_total",
    maxUsesPerUser: "max_uses_per_user",
    appliesTo: "applies_to",
    startDate: "start_date",
    endDate: "end_date",
    isActive: "is_active",
    showOnWebsite: "show_on_website",
    bannerImageUrl: "banner_image_url",
  };

  for (const [key, dbCol] of Object.entries(fieldMap)) {
    if (fields[key] !== undefined) {
      updateData[dbCol] = key === "code" ? fields[key].toUpperCase() : fields[key];
    }
  }

  const service = createServiceClient();
  const { error } = await service.from("promotions").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE: Remove promo
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service.from("promotions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
