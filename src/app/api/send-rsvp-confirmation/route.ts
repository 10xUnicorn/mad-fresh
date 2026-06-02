import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getResend, MAD_FRESH_FROM } from "@/lib/resend";
import { rsvpConfirmationEmail } from "@/lib/email-templates";
import { validateInternalRequest } from "@/lib/internal-auth";

export async function POST(req: NextRequest) {
  if (!validateInternalRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resend = getResend();

    const { firstName, email, guestCount, eventId } = await req.json();

    // Validate required fields
    if (!email || !firstName || guestCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch event details from Supabase (service client — no cookie dependency)
    const supabase = createServiceClient();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("name, event_date, start_time, venue_name")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Generate branded email HTML
    const emailHtml = rsvpConfirmationEmail({
      firstName,
      eventName: event.name,
      eventDate: new Date(event.event_date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      eventTime: event.start_time,
      venueName: event.venue_name,
      guestCount,
    });

    // Send email via Resend
    const result = await resend.emails.send({
      from: MAD_FRESH_FROM,
      to: email,
      subject: `RSVP Confirmed - ${event.name} - Mad Fresh Kitchen`,
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
    const STORE_ID = "b0000000-0000-0000-0000-000000000001";
    await supabase.from("notification_log").insert({
      store_id: STORE_ID,
      recipient_email: email,
      notification_type: "rsvp_confirmation",
      channel: "email",
      subject: `RSVP Confirmed - ${event.name}`,
      body: `RSVP confirmation email sent for ${event.name}`,
      reference_type: "event_rsvp",
      reference_id: eventId,
      status: "sent",
    });

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error("RSVP confirmation email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
