/**
 * Mail Service Layer — provider-agnostic email sending
 * Currently wraps Resend, but can be swapped to SendGrid/Mailgun/SES/Postmark
 */

import { getResend, MAD_FRESH_FROM, MAD_FRESH_REPLY_TO } from "./resend";
import { createServiceClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmailRecipient {
  email: string;
  first_name?: string;
  last_name?: string;
  contact_id?: string;
  [key: string]: unknown; // for merge fields
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  /** Email category for BCC routing and user preference checks */
  category?: string;
  /** User ID of the recipient (for preference checks) */
  recipientUserId?: string;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  results: {
    email: string;
    contact_id?: string;
    status: "sent" | "failed";
    messageId?: string;
    error?: string;
  }[];
}

// ─── Merge Field Replacement ─────────────────────────────────────────────────

const MERGE_FIELD_REGEX = /\{\{(\w+)(?:\s*\|\s*([^}]+))?\}\}/g;

/**
 * Replace {{field_name}} or {{field_name | fallback}} in a string
 */
export function replaceMergeFields(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(MERGE_FIELD_REGEX, (_, field, fallback) => {
    const value = data[field];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
    return fallback?.trim() || "";
  });
}

// ─── Email Wrapper (branded) ─────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mad-fresh.vercel.app";

/**
 * Wrap raw body HTML in the branded Mad Fresh email shell
 */
export function wrapInBrandedTemplate(bodyHtml: string, previewText?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${previewText ? `<span style="display:none;font-size:1px;color:#0a0a0a;max-height:0;overflow:hidden;mso-hide:all">${previewText}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111111;border:1px solid #1a1a1a;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#121212 100%);border-bottom:3px solid #75F663;padding:32px 32px 28px;text-align:center;">
              <p style="margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">
                <span style="color:#ffffff;">MAD</span>&nbsp;<span style="color:#75F663;">FRESH</span>
              </p>
              <p style="margin:6px 0 0;color:#888888;font-size:11px;letter-spacing:3px;text-transform:uppercase;">KITCHEN</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;color:#cccccc;font-size:14px;line-height:1.7;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#0a0a0a;border-top:1px solid #1a1a1a;text-align:center;">
              <p style="margin:0 0 8px;color:#555555;font-size:12px;line-height:1.6;">
                Mad Fresh Kitchen — Fresh meals, delivered.<br/>
                455 S 48th St, Tempe, AZ 85281
              </p>
              <p style="margin:0;color:#555555;font-size:11px;">
                <a href="${SITE_URL}/unsubscribe" style="color:#75F663;text-decoration:none;">Unsubscribe</a> ·
                <a href="${SITE_URL}/privacy" style="color:#75F663;text-decoration:none;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Single Email ───────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // ── Check user notification preferences ──────────────────────────────
    // If we have a recipient user ID and a category, check if they've opted out
    if (options.recipientUserId && options.category) {
      try {
        const service = createServiceClient();
        const { data: pref } = await service
          .from("user_notification_preferences")
          .select("enabled")
          .eq("user_id", options.recipientUserId)
          .eq("store_id", STORE_ID)
          .eq("category", options.category)
          .maybeSingle();

        // If a preference row exists and is explicitly disabled, skip sending
        if (pref && pref.enabled === false) {
          return { success: true, messageId: "skipped-user-opted-out" };
        }
      } catch {
        // If preference check fails, continue sending (fail open)
      }
    }

    // ── Resolve BCC recipients from admin_notification_settings ──────────
    let bccEmails: string[] = [];
    try {
      const service = createServiceClient();
      const { data: bccSettings } = await service
        .from("admin_notification_settings")
        .select("bcc_email, categories")
        .eq("store_id", STORE_ID)
        .eq("is_active", true);

      if (bccSettings && bccSettings.length > 0) {
        bccEmails = bccSettings
          .filter((setting) => {
            // If no category provided, BCC everyone (default behavior)
            if (!options.category) return true;
            // If setting has no categories array, include it for all emails
            if (!setting.categories || setting.categories.length === 0) return true;
            // Otherwise, only include if the category matches
            return setting.categories.includes(options.category);
          })
          .map((s) => s.bcc_email)
          // Don't BCC the same address as the recipient
          .filter((email) => email !== options.to);
      }
    } catch {
      // If BCC lookup fails, continue sending without BCC (fail open)
    }

    const resend = getResend();
    const result = await resend.emails.send({
      from: options.from || MAD_FRESH_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || MAD_FRESH_REPLY_TO,
      tags: options.tags,
      ...(bccEmails.length > 0 ? { bcc: bccEmails } : {}),
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

// ─── Send Test Email ─────────────────────────────────────────────────────────

export async function sendTestEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await sendEmail({
    to: options.to,
    subject: `[TEST] ${options.subject}`,
    html: options.html,
    from: options.from,
  });
  return result;
}

// ─── Send Bulk Campaign ──────────────────────────────────────────────────────

/**
 * Send a campaign to multiple recipients with merge field personalization.
 * Sends individually (not batch) to support per-recipient personalization.
 * Rate-limited to avoid hitting Resend limits.
 */
export async function sendBulkEmail(
  recipients: EmailRecipient[],
  options: {
    subject: string;
    bodyHtml: string;
    previewText?: string;
    from?: string;
    replyTo?: string;
    useWrapper?: boolean;
  }
): Promise<BulkSendResult> {
  const results: BulkSendResult["results"] = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    // Merge fields into subject and body
    const mergeData: Record<string, unknown> = {
      ...recipient,
      first_name: recipient.first_name || "",
      last_name: recipient.last_name || "",
      full_name: [recipient.first_name, recipient.last_name].filter(Boolean).join(" ") || "",
      email: recipient.email,
    };

    const personalizedSubject = replaceMergeFields(options.subject, mergeData);
    const personalizedBody = replaceMergeFields(options.bodyHtml, mergeData);
    const finalHtml = options.useWrapper !== false
      ? wrapInBrandedTemplate(personalizedBody, options.previewText ? replaceMergeFields(options.previewText, mergeData) : undefined)
      : personalizedBody;

    const result = await sendEmail({
      to: recipient.email,
      subject: personalizedSubject,
      html: finalHtml,
      from: options.from,
      replyTo: options.replyTo,
      tags: [{ name: "type", value: "campaign" }],
    });

    if (result.success) {
      sent++;
      results.push({
        email: recipient.email,
        contact_id: recipient.contact_id,
        status: "sent",
        messageId: result.messageId,
      });
    } else {
      failed++;
      results.push({
        email: recipient.email,
        contact_id: recipient.contact_id,
        status: "failed",
        error: result.error,
      });
    }

    // Small delay to avoid rate limiting (Resend allows ~10/sec on free tier)
    if (recipients.length > 5) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  return { total: recipients.length, sent, failed, results };
}

// ─── Resend Single Email ─────────────────────────────────────────────────────

export async function resendToRecipient(options: {
  email: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({ ...options, to: options.email });
}

// ─── Validate Recipients ─────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRecipients(
  recipients: EmailRecipient[]
): { valid: EmailRecipient[]; invalid: { email: string; reason: string }[] } {
  const valid: EmailRecipient[] = [];
  const invalid: { email: string; reason: string }[] = [];

  for (const r of recipients) {
    if (!r.email) {
      invalid.push({ email: "(empty)", reason: "Missing email address" });
    } else if (!EMAIL_REGEX.test(r.email)) {
      invalid.push({ email: r.email, reason: "Invalid email format" });
    } else {
      valid.push(r);
    }
  }

  return { valid, invalid };
}

// ─── Sanitize HTML ───────────────────────────────────────────────────────────

/**
 * Strip potentially dangerous elements from pasted HTML
 * Removes script tags, event handlers, and iframes
 */
export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}
