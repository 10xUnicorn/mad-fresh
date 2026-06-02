import { NextRequest, NextResponse } from "next/server";
import { getResend, MAD_FRESH_FROM, MAD_FRESH_REPLY_TO } from "@/lib/resend";
import { validateInternalRequest } from "@/lib/internal-auth";
import {
  orderConfirmationEmail,
  orderStatusUpdateEmail,
  rsvpConfirmationEmail,
  welcomeEmail,
  adminAccountCreatedEmail,
  staffAccountCreatedEmail,
  passwordResetEmail,
  accountActivatedEmail,
  subscriptionConfirmationEmail,
  subscriptionCancelledEmail,
  donationReceiptEmail,
  referralSuccessEmail,
  weeklyOrderReminderEmail,
} from "@/lib/email-templates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mad-fresh.vercel.app";

interface TestEmailResult {
  type: string;
  subject: string;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
}

function validateRequest(req: NextRequest): boolean {
  // Accept either INTERNAL_API_SECRET or CRON_SECRET
  if (validateInternalRequest(req)) return true;
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!validateRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resend = getResend();
    const { to } = await req.json();

    if (!to) {
      return NextResponse.json({ error: "Missing 'to' email address" }, { status: 400 });
    }

    const results: TestEmailResult[] = [];

    // Helper to send + log
    async function sendTest(type: string, subject: string, html: string) {
      try {
        const result = await resend.emails.send({
          from: MAD_FRESH_FROM,
          to,
          replyTo: MAD_FRESH_REPLY_TO,
          subject: `[TEST] ${subject}`,
          html,
        });
        if (result.error) {
          results.push({ type, subject, status: "failed", error: result.error.message });
        } else {
          results.push({ type, subject, status: "sent", messageId: result.data?.id });
        }
      } catch (err) {
        results.push({
          type,
          subject,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    // 1. Order Confirmation
    await sendTest(
      "order_confirmation",
      "Order Confirmed - #MF-TEST-001 - Mad Fresh Kitchen",
      orderConfirmationEmail({
        firstName: "Daniel",
        orderNumber: "MF-TEST-001",
        items: [
          { name: "Birria Beef Bowl", quantity: 1, price: 14.99 },
          { name: "Green Goddess Salad", quantity: 1, price: 12.99 },
          { name: "Churro Protein Bar", quantity: 2, price: 5.99 },
        ],
        subtotal: 39.96,
        discount: 5.0,
        deliveryFee: 3.99,
        tax: 2.85,
        total: 41.80,
        fulfillmentType: "delivery",
      })
    );

    // 2. Order Status Update (preparing)
    await sendTest(
      "order_status_preparing",
      "Your order is being prepared! - Mad Fresh Kitchen",
      orderStatusUpdateEmail({
        firstName: "Daniel",
        orderNumber: "MF-TEST-001",
        newStatus: "preparing",
        estimatedTime: "25-35 minutes",
      })
    );

    // 3. Order Status Update (delivered)
    await sendTest(
      "order_status_delivered",
      "Your order has been delivered! - Mad Fresh Kitchen",
      orderStatusUpdateEmail({
        firstName: "Daniel",
        orderNumber: "MF-TEST-001",
        newStatus: "delivered",
      })
    );

    // 4. RSVP Confirmation
    await sendTest(
      "rsvp_confirmation",
      "RSVP Confirmed - Mad Fresh App Launch Party",
      rsvpConfirmationEmail({
        firstName: "Daniel",
        eventName: "Mad Fresh App Launch Party",
        eventDate: "Wednesday, May 28",
        eventTime: "7:00 PM MST",
        venueName: "455 S 48th St, Tempe, AZ 85281",
        guestCount: 2,
      })
    );

    // 5. Welcome Email
    await sendTest(
      "welcome",
      "Welcome to Mad Fresh Kitchen!",
      welcomeEmail({ firstName: "Daniel" })
    );

    // 6. Admin Account Created
    await sendTest(
      "admin_account_created",
      "Your Mad Fresh Kitchen admin account is ready",
      adminAccountCreatedEmail({
        firstName: "Daniel",
        role: "Owner",
        loginUrl: `${SITE_URL}/login`,
      })
    );

    // 7. Staff Account Created
    await sendTest(
      "staff_account_created",
      "Welcome to the Mad Fresh Kitchen crew!",
      staffAccountCreatedEmail({
        firstName: "Daniel",
        role: "Kitchen Lead",
        loginUrl: `${SITE_URL}/login`,
      })
    );

    // 8. Password Reset
    await sendTest(
      "password_reset",
      "Reset your Mad Fresh Kitchen password",
      passwordResetEmail({
        firstName: "Daniel",
        resetUrl: `${SITE_URL}/reset-password?token=test-token-example`,
      })
    );

    // 9. Account Activated
    await sendTest(
      "account_activated",
      "Your Mad Fresh Kitchen account is active!",
      accountActivatedEmail({
        firstName: "Daniel",
        dashboardUrl: `${SITE_URL}/dashboard`,
      })
    );

    // 10. Subscription Confirmation
    await sendTest(
      "subscription_confirmation",
      "Subscription Confirmed - Mad Fresh Kitchen",
      subscriptionConfirmationEmail({
        firstName: "Daniel",
        planName: "Mad Fresh Medium",
        mealsPerWeek: 10,
        mealSize: "Medium (500-600 cal)",
        price: 79.0,
        billingCycle: "Weekly",
      })
    );

    // 11. Subscription Cancelled
    await sendTest(
      "subscription_cancelled",
      "Subscription Cancelled - Mad Fresh Kitchen",
      subscriptionCancelledEmail({
        firstName: "Daniel",
        planName: "Mad Fresh Medium",
        endDate: "June 15, 2026",
      })
    );

    // 12. Donation Receipt
    await sendTest(
      "donation_receipt",
      "Thank you for your donation! - Mad Fresh Kitchen",
      donationReceiptEmail({
        firstName: "Daniel",
        amount: 25.0,
        mealsEquivalent: 5,
        isAnonymous: false,
      })
    );

    // 13. Referral Success
    await sendTest(
      "referral_success",
      "Your referral worked! - Mad Fresh Kitchen",
      referralSuccessEmail({
        firstName: "Daniel",
        referredName: "Alex",
        pointsEarned: 500,
      })
    );

    // 14. Weekly Order Reminder
    await sendTest(
      "weekly_order_reminder",
      "Your meals are being prepared - Mad Fresh Kitchen",
      weeklyOrderReminderEmail({
        firstName: "Daniel",
        deliveryDay: "Wednesday",
        menuUrl: `${SITE_URL}/order`,
      })
    );

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      to,
      total: results.length,
      sent,
      failed,
      results,
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
