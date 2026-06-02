import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

async function getStaffUser() {
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
  return { ...user, role: roleData.role };
}

// GET: My tasks (staff sees their own, admin/manager sees all)
export async function GET(req: NextRequest) {
  const staffUser = await getStaffUser();
  if (!staffUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sopId = searchParams.get("sop_id");

  const service = createServiceClient();
  let query = service
    .from("staff_tasks")
    .select(`
      id, title, description, due_date, priority, status, notes,
      sop_id, sop_step_id, assigned_to, created_by,
      completed_at, completed_by, created_at, updated_at,
      sop_steps(id, title, step_number, is_critical, estimated_minutes, checklist, content_html)
    `)
    .eq("store_id", STORE_ID)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Staff only sees their own tasks; admin/manager sees all
  if (!["super_admin", "admin", "manager"].includes(staffUser.role)) {
    query = query.eq("assigned_to", staffUser.id);
  }

  if (status) query = query.eq("status", status);
  if (sopId) query = query.eq("sop_id", sopId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    tasks: data || [],
    userRole: staffUser.role,
    userId: staffUser.id,
  });
}

// PUT: Update own task (staff can update status, notes on their tasks)
export async function PUT(req: NextRequest) {
  const staffUser = await getStaffUser();
  if (!staffUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, notes } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const service = createServiceClient();

  // Verify task belongs to this user (unless admin)
  if (!["super_admin", "admin", "manager"].includes(staffUser.role)) {
    const { data: task } = await service
      .from("staff_tasks")
      .select("assigned_to")
      .eq("id", id)
      .single();

    if (!task || task.assigned_to !== staffUser.id) {
      return NextResponse.json({ error: "Not your task" }, { status: 403 });
    }
  }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (status !== undefined) {
    updateData.status = status;
    if (status === "done") {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = staffUser.id;
    } else {
      updateData.completed_at = null;
      updateData.completed_by = null;
    }
  }

  if (notes !== undefined) updateData.notes = notes;

  const { error } = await service.from("staff_tasks").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
