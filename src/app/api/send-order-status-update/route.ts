import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, MAD_FRESH_FROM } from "@/lib/resend";
import { orderStatusUpdateEmail } from "@/lib/email-templates";
import { validateInternalRequest } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  if (!validateInternalRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resend = getResend();

    const { orderId, orderNumber, email, firstName, newStatus, estimatedTime } =
      await req.json();

    // Validate required fields
    if (!email || !orderNumber || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate branded email HTML
    const emailHtml = orderStatusUpdateEmail({
      firstName: firstName || "Valued Customer",
      orderNumber,
      newStatus,
      estimatedTime,
    });

    // Send email via Resend
    const result = await resend.emails.send({
      from: MAD_FRESH_FROM,
      to: email,
      subject: `Order #${orderNumber} Status Updated - Mad Fresh Kitchen`,
      html: emailHtml,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Log to database
    const supabase = await createClient();
    const STORE_ID = "b0000000-0000-0000-0000-000000000001";

    await supabase.from("notification_log").insert({
      store_id: STORE_ID,
      recipient_email: email,
      notification_type: "order_status_update",
      channel: "email",
      subject: `Order #${orderNumber} Status Updated to ${newStatus.replace(/_/g, " ")}`,
      body: `Order status changed to ${newStatus.replace(/_/g, " ")}`,
      reference_type: "order",
      reference_id: orderId,
      status: "sent",
    });

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error("Order status update email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
