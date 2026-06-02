import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, MAD_FRESH_FROM } from "@/lib/resend";
import { orderConfirmationEmail } from "@/lib/email-templates";
import { validateInternalRequest } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  if (!validateInternalRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resend = getResend();

    const {
      orderId,
      email,
      firstName,
      orderNumber,
      items,
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      fulfillmentType,
      scheduledFor,
      timeSlot,
    } = await req.json();

    // Validate required fields
    if (!email || !firstName || !orderNumber || !items || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate branded email HTML
    const emailHtml = orderConfirmationEmail({
      firstName,
      orderNumber,
      items,
      subtotal,
      discount: discount || 0,
      deliveryFee: deliveryFee || 0,
      tax,
      total,
      fulfillmentType,
      scheduledFor,
      timeSlot,
    });

    // Send email via Resend (BCC owner so admin sees every order live)
    const result = await resend.emails.send({
      from: MAD_FRESH_FROM,
      to: email,
      bcc: ["madfreshkitchen@gmail.com"],
      subject: `Order Confirmed #${orderNumber} - Mad Fresh Kitchen`,
      html: emailHtml,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Log to database (column is body_preview, not body)
    const supabase = await createClient();
    const STORE_ID = "b0000000-0000-0000-0000-000000000001";

    const { error: logError } = await supabase.from("notification_log").insert({
      store_id: STORE_ID,
      recipient_email: email,
      notification_type: "order_confirmation",
      channel: "email",
      subject: `Order Confirmed #${orderNumber} - Mad Fresh Kitchen`,
      body_preview: `Order confirmation email sent for order ${orderNumber}`,
      reference_type: "order",
      reference_id: orderId,
      status: "sent",
      provider_message_id: result.data?.id || null,
    });

    if (logError) {
      // Don't fail the request — email was sent — but surface the issue in logs
      console.error("notification_log insert failed:", logError);
    }

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error("Order confirmation email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
