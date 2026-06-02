import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const STORE_ID = "b0000000-0000-0000-0000-000000000001";

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin role check
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin", "manager", "staff"])
      .maybeSingle();

    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status, assignedDriverId } = body;

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps based on status transition
    if (status === "preparing") {
      updateData.prep_started_at = new Date().toISOString();
    }
    if (status === "ready") {
      updateData.prep_completed_at = new Date().toISOString();
    }
    if (status === "out_for_delivery" && assignedDriverId) {
      updateData.assigned_driver_id = assignedDriverId;
      updateData.driver_assigned_at = new Date().toISOString();
    }

    // Update order
    const { data: order, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating order status:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create delivery assignment if assigning driver
    if (status === "out_for_delivery" && assignedDriverId) {
      await supabase.from("delivery_assignments").insert({
        order_id: id,
        driver_id: assignedDriverId,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      });
    }

    // Update delivery assignment status on delivered
    if (status === "delivered") {
      await supabase
        .from("delivery_assignments")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("order_id", id)
        .eq("status", "assigned");
    }

    // Log notification
    if (order.customer_email) {
      await supabase.from("notification_log").insert({
        store_id: STORE_ID,
        recipient_email: order.customer_email,
        notification_type: "order_status_update",
        channel: "system",
        subject: `Order #${order.order_number} status updated to ${status}`,
        body: `Order status changed to ${status.replace(/_/g, " ")}`,
        reference_type: "order",
        reference_id: id,
        status: "sent",
      });
    }

    // Send status update email notification
    if (order.customer_email && order.customer_name) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-order-status-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}`,
          },
          body: JSON.stringify({
            orderId: id,
            orderNumber: order.order_number,
            email: order.customer_email,
            firstName: order.customer_name.split(" ")[0],
            newStatus: status,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
