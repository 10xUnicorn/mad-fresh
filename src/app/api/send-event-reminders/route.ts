import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const EVENT_DATE = new Date("2026-05-28T19:00:00-07:00"); // 7 PM MST
const EVENT_ID = "f0000000-0000-0000-0000-000000000001";

const GOOGLE_CAL_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mad+Fresh+App+Launch+Party&dates=20260529T020000Z/20260529T040000Z&details=Free+event!+Be+the+first+to+access+the+Mad+Fresh+app%2C+lock+in+founding+member+pricing%2C+and+enjoy+chef-crafted+bowls.&location=455+S+48th+St%2C+Tempe%2C+AZ+85281";

const OUTLOOK_CAL_URL =
  "https://outlook.live.com/calendar/0/action/compose?subject=Mad+Fresh+App+Launch+Party&startdt=2026-05-29T02:00:00Z&enddt=2026-05-29T04:00:00Z&body=Free+event!+Be+the+first+to+access+the+Mad+Fresh+app,+lock+in+founding+member+pricing,+and+enjoy+chef-crafted+bowls.&location=455+S+48th+St,+Tempe,+AZ+85281";

// Reminder schedule: days before event → reminder type
const REMINDER_SCHEDULE: Record<number, string> = {
  14: "2_weeks",
  7: "1_week",
  3: "3_days",
  1: "1_day",
  0: "same_day",
};

interface ReminderConfig {
  subject: string;
  headline: string;
  subtext: string;
  urgencyColor: string;
  ctaText: string;
  showCalendarButtons: boolean;
}

function getReminderConfig(reminderType: string, firstName: string): ReminderConfig {
  switch (reminderType) {
    case "2_weeks":
      return {
        subject: `2 weeks out, ${firstName}! Mad Fresh Launch Party is almost here`,
        headline: "2 Weeks to Go!",
        subtext: "The Mad Fresh App Launch Party is just two weeks away. Make sure it's on your calendar — 100 spots, and they're filling fast.",
        urgencyColor: "#75F663",
        ctaText: "Add to Calendar",
        showCalendarButtons: true,
      };
    case "1_week":
      return {
        subject: `Next week, ${firstName}! Mad Fresh Launch Party — Thursday May 28`,
        headline: "1 Week Away!",
        subtext: "This time next week, you'll be tasting chef-crafted bowls, meeting the Mad Fresh team, and getting first access to the app. We can't wait.",
        urgencyColor: "#75F663",
        ctaText: "Get Directions",
        showCalendarButtons: true,
      };
    case "3_days":
      return {
        subject: `3 days, ${firstName}! See you Thursday at Mad Fresh`,
        headline: "3 Days Out!",
        subtext: "Final stretch. Thursday evening, 7 PM at 455 S 48th St in Tempe. Bring your appetite and your friends — founding member pricing locks in for everyone at the party.",
        urgencyColor: "#FFC107",
        ctaText: "Get Directions",
        showCalendarButtons: false,
      };
    case "1_day":
      return {
        subject: `Tomorrow night, ${firstName}! Mad Fresh Launch Party at 7 PM`,
        headline: "Tomorrow Night!",
        subtext: "It's almost time. Chef-crafted bowls, the app reveal, founding member pricing, and the energy of 100 people who believe in eating fresh. See you at 7 PM sharp.",
        urgencyColor: "#FF9800",
        ctaText: "Get Directions",
        showCalendarButtons: false,
      };
    case "same_day":
      return {
        subject: `TONIGHT at 7 PM, ${firstName}! Mad Fresh Launch Party 🎉`,
        headline: "Tonight's the Night!",
        subtext: "Doors open at 7 PM. Come hungry, come early. Chef Ty and Blanca have something special planned. See you in a few hours!",
        urgencyColor: "#FF5722",
        ctaText: "Get Directions Now",
        showCalendarButtons: false,
      };
    default:
      return {
        subject: `Reminder: Mad Fresh Launch Party — May 28`,
        headline: "Reminder",
        subtext: "Just a friendly reminder about the Mad Fresh App Launch Party.",
        urgencyColor: "#75F663",
        ctaText: "Get Directions",
        showCalendarButtons: false,
      };
  }
}

function buildReminderHtml(firstName: string, config: ReminderConfig): string {
  const calendarButtons = config.showCalendarButtons
    ? `
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0 0 12px; font-size:11px; letter-spacing:2px; color:#888; text-transform:uppercase; font-weight:600;">Add to Calendar</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32%" style="padding-right:6px;">
                    <a href="${GOOGLE_CAL_URL}" target="_blank" style="display:block; background-color:rgba(117,246,99,0.08); border:1px solid rgba(117,246,99,0.2); border-radius:12px; padding:14px 8px; text-align:center; text-decoration:none;">
                      <span style="font-size:20px; display:block; margin-bottom:4px;">📅</span>
                      <span style="font-size:12px; color:#75F663; font-weight:600;">Google</span>
                    </a>
                  </td>
                  <td width="32%" style="padding:0 3px;">
                    <a href="https://mad-fresh.vercel.app/api/calendar/launch-party.ics" target="_blank" style="display:block; background-color:rgba(117,246,99,0.08); border:1px solid rgba(117,246,99,0.2); border-radius:12px; padding:14px 8px; text-align:center; text-decoration:none;">
                      <span style="font-size:20px; display:block; margin-bottom:4px;">🍎</span>
                      <span style="font-size:12px; color:#75F663; font-weight:600;">Apple</span>
                    </a>
                  </td>
                  <td width="32%" style="padding-left:6px;">
                    <a href="${OUTLOOK_CAL_URL}" target="_blank" style="display:block; background-color:rgba(117,246,99,0.08); border:1px solid rgba(117,246,99,0.2); border-radius:12px; padding:14px 8px; text-align:center; text-decoration:none;">
                      <span style="font-size:20px; display:block; margin-bottom:4px;">📧</span>
                      <span style="font-size:12px; color:#75F663; font-weight:600;">Outlook</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.headline} — Mad Fresh Launch Party</title>
</head>
<body style="margin:0; padding:0; background-color:#0a1f0a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1f0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#0d2b0d; border:1px solid rgba(117,246,99,0.15); border-radius:24px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #449531 0%, #2D7A1E 50%, #1a5c12 100%); padding:40px; text-align:center;">
              <p style="margin:0 0 6px; font-size:12px; letter-spacing:3px; color:rgba(255,255,255,0.7); text-transform:uppercase; font-weight:600;">Event Reminder</p>
              <h1 style="margin:0; font-size:36px; font-weight:900; color:${config.urgencyColor}; line-height:1.1;">${config.headline}</h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <p style="margin:0 0 16px; font-size:18px; color:#ffffff; font-weight:600;">Hey ${firstName}!</p>
              <p style="margin:0; font-size:15px; color:#b0b0b0; line-height:1.7;">${config.subtext}</p>
            </td>
          </tr>

          <!-- Event Details Card -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(117,246,99,0.05); border:1px solid rgba(117,246,99,0.12); border-radius:16px;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 12px;">
                          <span style="font-size:16px;">📅</span>
                          <span style="padding-left:8px; font-size:15px; color:#fff; font-weight:600;">Thursday, May 28, 2026</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 12px;">
                          <span style="font-size:16px;">⏰</span>
                          <span style="padding-left:8px; font-size:15px; color:#fff; font-weight:600;">7:00 PM – 9:00 PM MST</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0;">
                          <span style="font-size:16px;">📍</span>
                          <span style="padding-left:8px; font-size:15px; color:#fff; font-weight:600;">455 S 48th St, Tempe, AZ 85281</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Calendar Buttons (conditional) -->
          ${calendarButtons}

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 32px; text-align:center;">
              <a href="https://www.google.com/maps/search/?api=1&query=455+S+48th+St+Tempe+AZ+85281" target="_blank" style="display:inline-block; background:linear-gradient(135deg, #449531, #75F663); color:#0a1f0a; font-size:15px; font-weight:700; padding:14px 32px; border-radius:50px; text-decoration:none;">
                ${config.ctaText} →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center;">
              <p style="margin:0 0 4px; font-size:14px; font-weight:700; color:#ffffff;">
                MAD <span style="color:#75F663;">FRESH</span> KITCHEN
              </p>
              <p style="margin:0 0 12px; font-size:12px; color:#666;">
                455 S 48th St, Tempe, AZ 85281 · (480) 382-7755
              </p>
              <p style="margin:0; font-size:11px; color:#555;">
                <a href="https://madfresh.app" style="color:#75F663; text-decoration:none;">MadFresh.app</a>
                &nbsp;·&nbsp;
                <a href="https://instagram.com/eatmadfresh" style="color:#75F663; text-decoration:none;">@eatmadfresh</a>
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

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const msUntilEvent = EVENT_DATE.getTime() - now.getTime();
    const daysUntilEvent = Math.round(msUntilEvent / (1000 * 60 * 60 * 24));

    // Check if today matches any reminder schedule
    const reminderType = REMINDER_SCHEDULE[daysUntilEvent];
    if (!reminderType) {
      return NextResponse.json({
        message: `No reminder scheduled for ${daysUntilEvent} days out`,
        daysUntilEvent,
      });
    }

    // Fetch all confirmed RSVPs
    const supabaseAdmin = getSupabaseAdmin();
    const { data: rsvps, error: fetchError } = await supabaseAdmin
      .from("event_rsvps")
      .select("first_name, email")
      .eq("event_id", EVENT_ID)
      .eq("status", "confirmed");

    if (fetchError) {
      console.error("Failed to fetch RSVPs:", fetchError);
      return NextResponse.json({ error: "Failed to fetch RSVPs" }, { status: 500 });
    }

    if (!rsvps || rsvps.length === 0) {
      return NextResponse.json({ message: "No confirmed RSVPs found" });
    }

    // Send reminder to each RSVP (batch via Resend)
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Resend batch limit is 100 per request
    const batches = [];
    for (let i = 0; i < rsvps.length; i += 100) {
      batches.push(rsvps.slice(i, i + 100));
    }

    for (const batch of batches) {
      const emails = batch.map((rsvp) => {
        const config = getReminderConfig(reminderType, rsvp.first_name);
        return {
          from: "Mad Fresh Kitchen <hello@madfresh.app>",
          to: [rsvp.email],
          subject: config.subject,
          html: buildReminderHtml(rsvp.first_name, config),
        };
      });

      try {
        const { data, error } = await getResend().batch.send(emails);
        if (error) {
          failed += batch.length;
          errors.push(error.message);
        } else {
          sent += data?.data?.length || batch.length;
        }
      } catch (err) {
        failed += batch.length;
        errors.push(err instanceof Error ? err.message : "Unknown batch error");
      }
    }

    // Log the reminder send
    try {
      await supabaseAdmin.from("event_reminder_log").insert({
        event_id: EVENT_ID,
        reminder_type: reminderType,
        days_before: daysUntilEvent,
        recipients_count: rsvps.length,
        sent_count: sent,
        failed_count: failed,
        errors: errors.length > 0 ? errors : null,
      });
    } catch {
      // Log table might not exist yet — that's ok
    }

    return NextResponse.json({
      success: true,
      reminderType,
      daysUntilEvent,
      totalRsvps: rsvps.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Reminder cron error:", err);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}

// GET handler for manual testing (also requires auth)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const msUntilEvent = EVENT_DATE.getTime() - now.getTime();
  const daysUntilEvent = Math.round(msUntilEvent / (1000 * 60 * 60 * 24));
  const reminderType = REMINDER_SCHEDULE[daysUntilEvent];

  return NextResponse.json({
    eventDate: EVENT_DATE.toISOString(),
    currentDate: now.toISOString(),
    daysUntilEvent,
    scheduledReminder: reminderType || "none",
    allSchedule: REMINDER_SCHEDULE,
  });
}
