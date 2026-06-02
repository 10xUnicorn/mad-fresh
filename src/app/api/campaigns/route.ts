/**
 * Campaign CRUD + Send API
 * POST - Create campaign / Send campaign / Send test / Resend
 * GET  - List campaigns
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  sendBulkEmail,
  sendTestEmail,
  replaceMergeFields,
  wrapInBrandedTemplate,
  sanitizeEmailHtml,
  validateRecipients,
  type EmailRecipient,
} from "@/lib/mail-service";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// ─── Auth helper: verify admin/super_admin/manager/staff ────────────────────

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin", "manager", "staff"])
    .maybeSingle();

  if (!role) {
    return { user, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, error: null };
}

// ─── GET: List campaigns ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Auth + admin check
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("campaigns")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

// ─── POST: Create / Send / Test / Resend ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth + admin check
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const service = createServiceClient();
  const body = await req.json();
  const { action } = body;

  // ── Create or Update Campaign ──
  if (action === "create" || action === "update") {
    const {
      id,
      name,
      type = "email_blast",
      subject,
      preview_text,
      body_html,
      body: bodyText,
      from_name,
      from_email,
      reply_to,
      editor_mode,
      audience_filter,
      scheduled_for,
      template_id,
      status: campaignStatus = "draft",
    } = body;

    const campaignData = {
      store_id: STORE_ID,
      name,
      type,
      subject,
      preview_text,
      body_html: body_html ? sanitizeEmailHtml(body_html) : null,
      body: bodyText || "",
      from_name,
      from_email,
      reply_to,
      editor_mode,
      audience_filter,
      scheduled_for,
      template_id,
      status: campaignStatus,
      updated_at: new Date().toISOString(),
    };

    if (action === "update" && id) {
      const { data, error } = await supabase
        .from("campaigns")
        .update(campaignData)
        .eq("id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ campaign: data });
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert(campaignData)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  }

  // ── Send Test Email ──
  if (action === "send_test") {
    const { to, subject, body_html, preview_text } = body;
    if (!to || !subject || !body_html) {
      return NextResponse.json({ error: "Missing to, subject, or body_html" }, { status: 400 });
    }

    const wrappedHtml = wrapInBrandedTemplate(
      replaceMergeFields(body_html, { first_name: "Test", last_name: "User", email: to }),
      preview_text
    );

    const result = await sendTestEmail({ to, subject, html: wrappedHtml });
    return NextResponse.json(result);
  }

  // ── Send Campaign ──
  if (action === "send") {
    const { campaign_id } = body;
    if (!campaign_id) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 });
    }

    // Fetch campaign
    const { data: campaign, error: campError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "sent" || campaign.status === "sending") {
      return NextResponse.json({ error: "Campaign already sent or sending" }, { status: 400 });
    }

    // Resolve recipients from audience_filter
    const recipients = await resolveRecipients(service, campaign.audience_filter);
    const { valid, invalid } = validateRecipients(recipients);

    if (valid.length === 0) {
      return NextResponse.json({ error: "No valid recipients found", invalid }, { status: 400 });
    }

    // Mark as sending
    await supabase
      .from("campaigns")
      .update({ status: "sending", recipient_count: valid.length })
      .eq("id", campaign_id);

    // Create recipient records
    const recipientRecords = valid.map((r) => ({
      campaign_id,
      contact_id: r.contact_id || null,
      email: r.email,
      first_name: r.first_name || null,
      last_name: r.last_name || null,
      status: "pending",
    }));

    await service.from("campaign_recipients").insert(recipientRecords);

    // Send emails
    const emailBody = campaign.body_html || campaign.body || "";
    const result = await sendBulkEmail(valid, {
      subject: campaign.subject || campaign.name,
      bodyHtml: emailBody,
      previewText: campaign.preview_text,
      from: campaign.from_name
        ? `${campaign.from_name} <${campaign.from_email || "hello@madfresh.app"}>`
        : undefined,
      replyTo: campaign.reply_to,
    });

    // Update recipient statuses
    for (const r of result.results) {
      const updateData: Record<string, unknown> = {
        status: r.status,
        sent_at: r.status === "sent" ? new Date().toISOString() : null,
        provider_message_id: r.messageId || null,
        failed_reason: r.error || null,
      };
      await service
        .from("campaign_recipients")
        .update(updateData)
        .eq("campaign_id", campaign_id)
        .eq("email", r.email);
    }

    // Update campaign stats
    await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        delivered_count: result.sent,
        failed_count: result.failed,
        total_recipients: result.total,
      })
      .eq("id", campaign_id);

    // Log to notification_log
    for (const r of result.results.filter((r) => r.status === "sent")) {
      await service.from("notification_log").insert({
        store_id: STORE_ID,
        recipient_email: r.email,
        notification_type: "campaign",
        channel: "email",
        subject: campaign.subject || campaign.name,
        body_preview: (campaign.preview_text || "").slice(0, 200),
        reference_type: "campaign",
        reference_id: campaign_id,
        status: "sent",
        provider_message_id: r.messageId,
      });
    }

    return NextResponse.json({
      success: true,
      total: result.total,
      sent: result.sent,
      failed: result.failed,
    });
  }

  // ── Resend to specific recipients ──
  if (action === "resend") {
    const { campaign_id, recipient_ids, recipient_emails } = body;
    if (!campaign_id) {
      return NextResponse.json({ error: "Missing campaign_id" }, { status: 400 });
    }

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Get recipients to resend to
    let query = service
      .from("campaign_recipients")
      .select("*")
      .eq("campaign_id", campaign_id);

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

    const emailRecipients: EmailRecipient[] = recipientsToResend.map((r: any) => ({
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      contact_id: r.contact_id,
    }));

    const emailBody = campaign.body_html || campaign.body || "";
    const result = await sendBulkEmail(emailRecipients, {
      subject: campaign.subject || campaign.name,
      bodyHtml: emailBody,
      previewText: campaign.preview_text,
    });

    // Update recipient records
    for (const r of result.results) {
      await service
        .from("campaign_recipients")
        .update({
          status: r.status,
          sent_at: r.status === "sent" ? new Date().toISOString() : null,
          provider_message_id: r.messageId || null,
          failed_reason: r.error || null,
          resend_count: 1,
          last_resent_at: new Date().toISOString(),
        })
        .eq("campaign_id", campaign_id)
        .eq("email", r.email);
    }

    return NextResponse.json({
      success: true,
      resent: result.sent,
      failed: result.failed,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// ─── Resolve recipients from audience filter ─────────────────────────────────

async function resolveRecipients(
  supabase: ReturnType<typeof createServiceClient>,
  filter: Record<string, unknown> | null
): Promise<EmailRecipient[]> {
  let query = supabase
    .from("contacts")
    .select("id, email, first_name, last_name, source, contact_type, has_active_subscription, total_orders, is_newsletter_subscribed, tags, unsubscribed_at")
    .eq("store_id", STORE_ID)
    .is("unsubscribed_at", null); // Always exclude unsubscribed

  if (filter) {
    // Source filter
    if (filter.source) {
      if (Array.isArray(filter.source)) {
        query = query.in("source", filter.source as string[]);
      } else {
        query = query.eq("source", filter.source as string);
      }
    }

    // Contact type
    if (filter.contact_type) {
      if (Array.isArray(filter.contact_type)) {
        query = query.in("contact_type", filter.contact_type as string[]);
      } else {
        query = query.eq("contact_type", filter.contact_type as string);
      }
    }

    // Active subscription
    if (filter.has_active_subscription !== undefined) {
      query = query.eq("has_active_subscription", filter.has_active_subscription as boolean);
    }

    // Newsletter subscribed
    if (filter.is_newsletter_subscribed !== undefined) {
      query = query.eq("is_newsletter_subscribed", filter.is_newsletter_subscribed as boolean);
    }

    // Has purchased
    if (filter.has_purchased === true) {
      query = query.gt("total_orders", 0);
    } else if (filter.has_purchased === false) {
      query = query.eq("total_orders", 0);
    }

    // Exclude types
    if (filter.exclude_types && Array.isArray(filter.exclude_types)) {
      for (const t of filter.exclude_types as string[]) {
        query = query.neq("contact_type", t);
      }
    }

    // Specific contact IDs (manual selection)
    if (filter.contact_ids && Array.isArray(filter.contact_ids)) {
      query = query.in("id", filter.contact_ids as string[]);
    }

    // Event registration filter
    if (filter.event_id) {
      // For event-based targeting, we fetch event RSVPs separately
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("email")
        .eq("event_id", filter.event_id as string);

      if (rsvps?.length) {
        const emails = rsvps.map((r: any) => r.email);
        query = query.in("email", emails);
      } else {
        return []; // No RSVPs for this event
      }
    }
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((c: any) => ({
    email: c.email,
    first_name: c.first_name,
    last_name: c.last_name,
    contact_id: c.id,
    source: c.source,
    contact_type: c.contact_type,
    subscription_status: c.has_active_subscription ? "active" : "inactive",
  }));
}
