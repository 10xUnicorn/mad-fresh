/**
 * Campaign Recipients API
 * GET  - List recipients for a campaign with delivery status
 * POST - Resend to specific recipients
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail, wrapInBrandedTemplate, replaceMergeFields } from "@/lib/mail-service";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: recipients, error } = await supabase
    .from("campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipients: recipients || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const service = createServiceClient();
  const body = await req.json();
  const { action, recipient_ids, recipient_emails } = body;

  if (action !== "resend") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Fetch the campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get recipients to resend to
  let query = service
    .from("campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId);

  if (recipient_ids?.length) {
    query = query.in("id", recipient_ids);
  } else if (recipient_emails?.length) {
    query = query.in("email", recipient_emails);
  } else {
    // Resend to all failed
    query = query.in("status", ["failed", "bounced"]);
  }

  const { data: recipientsToResend } = await query;
  if (!recipientsToResend?.length) {
    return NextResponse.json({ error: "No recipients to resend to" }, { status: 400 });
  }

  let sent = 0;
  let failed = 0;

  for (const r of recipientsToResend) {
    const mergeData: Record<string, unknown> = {
      first_name: r.first_name || "",
      last_name: r.last_name || "",
      email: r.email,
    };

    const emailBody = campaign.body_html || campaign.body || "";
    const personalizedBody = replaceMergeFields(emailBody, mergeData);
    const personalizedSubject = replaceMergeFields(
      campaign.subject || campaign.name,
      mergeData
    );
    const finalHtml = wrapInBrandedTemplate(
      personalizedBody,
      campaign.preview_text ? replaceMergeFields(campaign.preview_text, mergeData) : undefined
    );

    const result = await sendEmail({
      to: r.email,
      subject: personalizedSubject,
      html: finalHtml,
      from: campaign.from_name
        ? `${campaign.from_name} <${campaign.from_email || "hello@madfresh.app"}>`
        : undefined,
      replyTo: campaign.reply_to,
    });

    const updateData: Record<string, unknown> = {
      status: result.success ? "sent" : "failed",
      sent_at: result.success ? new Date().toISOString() : null,
      provider_message_id: result.messageId || null,
      failed_reason: result.error || null,
      last_resent_at: new Date().toISOString(),
    };

    await service
      .from("campaign_recipients")
      .update(updateData)
      .eq("id", r.id);

    if (result.success) sent++;
    else failed++;

    // Rate limit
    if (recipientsToResend.length > 5) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}
