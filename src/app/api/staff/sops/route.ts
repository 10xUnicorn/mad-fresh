import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

async function getStaffRole() {
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

  if (!roleData) return null;
  return { user, role: roleData.role as string };
}

// GET: List published SOPs visible to this user's role
export async function GET(req: NextRequest) {
  const staff = await getStaffRole();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sopId = searchParams.get("id");
  const categorySlug = searchParams.get("category");

  const service = createServiceClient();

  // Single SOP fetch
  if (sopId) {
    const { data: sop, error } = await service
      .from("sops")
      .select(`
        id, title, slug, description, content_html, status, version,
        visible_to_roles, time_percent, updated_at, published_at,
        category_id,
        sop_categories(id, name, slug, icon, color),
        sop_steps(id, title, description, content_html, step_number, estimated_minutes, is_critical, checklist,
          sop_resources(id, resource_type, title, url, description)
        )
      `)
      .eq("id", sopId)
      .eq("store_id", STORE_ID)
      .eq("status", "published")
      .single();

    if (error || !sop) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sopData = sop as any;

    // Check role visibility
    if (sopData.visible_to_roles?.length > 0 && !sopData.visible_to_roles.includes(staff.role)) {
      return NextResponse.json({ error: "Not authorized for this SOP" }, { status: 403 });
    }

    // Sort steps
    if (sopData.sop_steps) {
      sopData.sop_steps.sort((a: any, b: any) => a.step_number - b.step_number);
    }

    return NextResponse.json(sopData);
  }

  // List all published SOPs for this role
  let query = service
    .from("sops")
    .select(`
      id, title, slug, description, status, version, visible_to_roles,
      time_percent, updated_at, published_at,
      category_id,
      sop_categories(id, name, slug, icon, color),
      sop_steps(id)
    `)
    .eq("store_id", STORE_ID)
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  const { data: sops, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter by role visibility (visible_to_roles empty = visible to all)
  const allSOPs = (sops || []) as any[];
  const filtered = allSOPs.filter((sop: any) => {
    if (!sop.visible_to_roles || sop.visible_to_roles.length === 0) return true;
    return sop.visible_to_roles.includes(staff.role);
  });

  // Optionally filter by category slug
  let result = filtered;
  if (categorySlug) {
    result = filtered.filter((s: any) => s.sop_categories?.slug === categorySlug);
  }

  // Fetch categories
  const { data: categories } = await service
    .from("sop_categories")
    .select("*")
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .order("sort_order");

  return NextResponse.json({
    sops: result,
    categories: categories || [],
    userRole: staff.role,
  });
}
