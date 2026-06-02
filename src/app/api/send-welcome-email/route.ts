import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, MAD_FRESH_FROM } from "@/lib/resend";
import { welcomeEmail } from "@/lib/email-templates";
import { validateInternalRequest } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  if (!validateInternalRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resend = getResend();

    const { email, firstName, userId } = await req.json();

    // Validate required fields
    if (!email || !firstName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate branded email HTML
    const emailHtml = welcomeEmail({ firstName });

    // Send email via Resend
    const result = await resend.emails.send({
      from: MAD_FRESH_FROM,
      to: email,
      subject: "Welcome to Mad Fresh Kitchen!",
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
      notification_type: "welcome_email",
      channel: "email",
      subject: "Welcome to Mad Fresh Kitchen!",
      body: "Welcome email sent to new customer",
      reference_type: "customer",
      reference_id: userId,
      status: "sent",
    });

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error("Welcome email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
