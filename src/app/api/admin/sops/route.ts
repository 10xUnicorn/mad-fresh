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

// GET: List all SOPs (with optional category filter)
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("category");
  const sopId = searchParams.get("id");

  const service = createServiceClient();

  // Single SOP fetch with steps and resources
  if (sopId) {
    const { data: sop, error } = await service
      .from("sops")
      .select(`
        *,
        sop_categories(id, name, slug, icon, color),
        sop_steps(*, sop_resources(*)),
        sop_resources(*)
      `)
      .eq("id", sopId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    // Sort steps by step_number
    if (sop.sop_steps) {
      sop.sop_steps.sort((a: any, b: any) => a.step_number - b.step_number);
    }

    return NextResponse.json(sop);
  }

  // List SOPs
  let query = service
    .from("sops")
    .select(`
      id, title, slug, description, status, version, visible_to_roles,
      time_percent, assigned_to, created_at, updated_at, published_at,
      category_id,
      sop_categories(id, name, slug, icon, color),
      sop_steps(id)
    `)
    .eq("store_id", STORE_ID)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also fetch categories
  const { data: categories } = await service
    .from("sop_categories")
    .select("*")
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .order("sort_order");

  return NextResponse.json({ sops: data || [], categories: categories || [] });
}

// POST: Create new SOP
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, categoryId, visibleToRoles, status } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);

  const service = createServiceClient();

  const { data, error } = await service
    .from("sops")
    .insert({
      store_id: STORE_ID,
      title,
      slug,
      description: description || null,
      category_id: categoryId || null,
      visible_to_roles: visibleToRoles || [],
      status: status || "draft",
      created_by: admin.id,
      updated_by: admin.id,
    })
    .select(`*, sop_categories(id, name, slug, icon, color)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// PUT: Update SOP
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, title, description, categoryId, contentHtml, visibleToRoles, status, timePercent, assignedTo, steps } = body;

  if (!id) return NextResponse.json({ error: "SOP id required" }, { status: 400 });

  const service = createServiceClient();

  // Update the SOP itself
  const updateData: Record<string, any> = { updated_by: admin.id, updated_at: new Date().toISOString() };
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (categoryId !== undefined) updateData.category_id = categoryId || null;
  if (contentHtml !== undefined) updateData.content_html = contentHtml;
  if (visibleToRoles !== undefined) updateData.visible_to_roles = visibleToRoles;
  if (status !== undefined) {
    updateData.status = status;
    if (status === "published") updateData.published_at = new Date().toISOString();
  }
  if (timePercent !== undefined) updateData.time_percent = timePercent;
  if (assignedTo !== undefined) updateData.assigned_to = assignedTo;

  const { error: sopError } = await service.from("sops").update(updateData).eq("id", id);
  if (sopError) return NextResponse.json({ error: sopError.message }, { status: 500 });

  // Update steps if provided (full replacement)
  if (steps !== undefined) {
    // Delete existing steps
    await service.from("sop_steps").delete().eq("sop_id", id);

    // Insert new steps
    if (steps.length > 0) {
      const stepInserts = steps.map((step: any, i: number) => ({
        sop_id: id,
        title: step.title,
        description: step.description || null,
        content_html: step.contentHtml || "",
        step_number: i + 1,
        estimated_minutes: step.estimatedMinutes || null,
        is_critical: step.isCritical || false,
        checklist: step.checklist || [],
      }));

      const { error: stepsError } = await service.from("sop_steps").insert(stepInserts);
      if (stepsError) return NextResponse.json({ error: stepsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE: Archive SOP
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service
    .from("sops")
    .update({ status: "archived", updated_by: admin.id })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
