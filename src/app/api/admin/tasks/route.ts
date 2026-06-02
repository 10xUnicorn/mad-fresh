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

// GET: List tasks (optionally filtered by sop_id, assigned_to, status)
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sopId = searchParams.get("sop_id");
  const assignedTo = searchParams.get("assigned_to");
  const status = searchParams.get("status");

  const service = createServiceClient();
  let query = service
    .from("staff_tasks")
    .select(`
      *,
      sop_steps(id, title, step_number, is_critical, estimated_minutes, checklist)
    `)
    .eq("store_id", STORE_ID)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (sopId) query = query.eq("sop_id", sopId);
  if (assignedTo) query = query.eq("assigned_to", assignedTo);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

// POST: Create tasks from an SOP (generate individual tasks from each step)
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sopId, assignedTo, dueDate, priority, tasks: manualTasks } = body;

  const service = createServiceClient();

  // If manual tasks array provided, create those directly
  if (manualTasks && Array.isArray(manualTasks)) {
    const inserts = manualTasks.map((t: any) => ({
      store_id: STORE_ID,
      title: t.title,
      description: t.description || null,
      assigned_to: t.assignedTo || null,
      due_date: t.dueDate || null,
      priority: t.priority || "normal",
      status: "todo",
      sop_id: t.sopId || null,
      sop_step_id: t.sopStepId || null,
      created_by: admin.id,
    }));

    const { data, error } = await service.from("staff_tasks").insert(inserts).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ created: data?.length || 0, tasks: data });
  }

  // Generate tasks from SOP steps
  if (!sopId) {
    return NextResponse.json({ error: "sopId or tasks array required" }, { status: 400 });
  }

  // Get the SOP and its steps
  const { data: sop, error: sopError } = await service
    .from("sops")
    .select("id, title, sop_steps(id, title, step_number, estimated_minutes, is_critical, checklist)")
    .eq("id", sopId)
    .single();

  if (sopError || !sop) {
    return NextResponse.json({ error: "SOP not found" }, { status: 404 });
  }

  const steps = (sop as any).sop_steps || [];
  if (steps.length === 0) {
    return NextResponse.json({ error: "SOP has no steps to generate tasks from" }, { status: 400 });
  }

  // Sort steps by step_number
  steps.sort((a: any, b: any) => a.step_number - b.step_number);

  // Create a task for each step
  const inserts = steps.map((step: any) => ({
    store_id: STORE_ID,
    title: `${sop.title} — Step ${step.step_number}: ${step.title}`,
    description: step.is_critical ? "⚠️ CRITICAL STEP" : null,
    assigned_to: assignedTo || null,
    due_date: dueDate || null,
    priority: step.is_critical ? "high" : (priority || "normal"),
    status: "todo",
    sop_id: sopId,
    sop_step_id: step.id,
    created_by: admin.id,
  }));

  const { data, error } = await service.from("staff_tasks").insert(inserts).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    created: data?.length || 0,
    sopTitle: sop.title,
    tasks: data,
  });
}

// PUT: Update a task (status, assigned_to, notes, etc.)
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  const fieldMap: Record<string, string> = {
    title: "title",
    description: "description",
    assignedTo: "assigned_to",
    dueDate: "due_date",
    priority: "priority",
    status: "status",
    notes: "notes",
  };

  for (const [key, dbCol] of Object.entries(fieldMap)) {
    if (fields[key] !== undefined) {
      updateData[dbCol] = fields[key];
    }
  }

  // If marking as completed, set completed_at and completed_by
  if (fields.status === "done") {
    updateData.completed_at = new Date().toISOString();
    updateData.completed_by = admin.id;
  }

  // If reopening, clear completed fields
  if (fields.status === "todo" || fields.status === "in_progress") {
    updateData.completed_at = null;
    updateData.completed_by = null;
  }

  const service = createServiceClient();
  const { error } = await service.from("staff_tasks").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE: Remove a task
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const sopId = searchParams.get("sop_id"); // Delete all tasks for an SOP

  const service = createServiceClient();

  if (sopId) {
    const { error } = await service.from("staff_tasks").delete().eq("sop_id", sopId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (!id) return NextResponse.json({ error: "id or sop_id required" }, { status: 400 });

  const { error } = await service.from("staff_tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
