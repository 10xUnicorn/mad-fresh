import { getRandomFoodTip } from "./resend";

/**
 * Order confirmation email template
 * Sent when customer completes checkout
 */
export function orderConfirmationEmail({
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
}: {
  firstName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  fulfillmentType: string;
  scheduledFor?: string;
  timeSlot?: string;
}): string {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr style="border-bottom: 1px solid #1a1a1a;">
        <td style="padding: 12px 0; color: #ffffff;">${item.name}</td>
        <td style="padding: 12px 0; text-align: center; color: #ffffff;">x${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right; color: #75F663; font-weight: 600;">$${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const scheduleInfo =
    fulfillmentType === "scheduled" && scheduledFor && timeSlot
      ? `<p style="margin: 0 0 16px; color: #d0d0d0; font-size: 14px;">
        <strong style="color: #75F663;">📅 Scheduled for:</strong> ${new Date(scheduledFor).toLocaleDateString()} at ${timeSlot}
      </p>`
      : `<p style="margin: 0 0 16px; color: #d0d0d0; font-size: 14px;">
        <strong style="color: #75F663;">🚚 Fulfillment:</strong> ${fulfillmentType === "delivery" ? "Delivery" : "Pickup"}
      </p>`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0f0f0f; border: 1px solid #1a1a1a;">
      <!-- Header with brand accent -->
      <div style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;"><span style="color: #ffffff;">MAD</span> <span style="color: #75F663;">FRESH</span></h1>
        <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Fresh. Bold. Delivered.</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">
        <h2 style="margin: 0 0 24px; color: #75F663; font-size: 20px;">Order Confirmed!</h2>

        <p style="margin: 0 0 8px; color: #ffffff;">Hi ${firstName},</p>
        <p style="margin: 0 0 24px; color: #d0d0d0; line-height: 1.6;">
          Your order <strong style="color: #75F663;">#${orderNumber}</strong> has been confirmed and is being prepared with fresh, quality ingredients.
        </p>

        ${scheduleInfo}

        <!-- Order items -->
        <div style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Order summary -->
        <div style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1a1a1a;">
            <span style="color: #d0d0d0;">Subtotal</span>
            <span style="color: #ffffff;">$${subtotal.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1a1a1a;">
            <span style="color: #75F663;">Discount</span>
            <span style="color: #75F663;">-$${discount.toFixed(2)}</span>
          </div>` : ""}
          ${deliveryFee > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1a1a1a;">
            <span style="color: #d0d0d0;">Delivery Fee</span>
            <span style="color: #ffffff;">$${deliveryFee.toFixed(2)}</span>
          </div>` : ""}
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1a1a1a;">
            <span style="color: #d0d0d0;">Tax</span>
            <span style="color: #ffffff;">$${tax.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 18px;">
            <span style="color: #75F663;">Total</span>
            <span style="color: #75F663;">$${total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Call to action -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${orderNumber}" style="display: inline-block; background-color: #2D7A1E; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Track Your Order
          </a>
        </div>
      </div>

      <!-- Footer with food tip -->
      <div style="padding: 24px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a;">
        <div style="border: 2px solid #75F663; border-radius: 8px; padding: 16px; background-color: #0f0f0f; margin-bottom: 16px;">
          <p style="margin: 0; color: #75F663; font-size: 13px; line-height: 1.6;">
            ${getRandomFoodTip(orderNumber)}
          </p>
        </div>

        <p style="margin: 0; text-align: center; color: #666; font-size: 12px;">
          Mad Fresh Kitchen — Fresh. Bold. Delivered.<br />
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
        </p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

/**
 * Order status update email template
 * Sent when order status changes (preparing, ready, out for delivery, delivered)
 */
export function orderStatusUpdateEmail({
  firstName,
  orderNumber,
  newStatus,
  estimatedTime,
}: {
  firstName: string;
  orderNumber: string;
  newStatus: string;
  estimatedTime?: string;
}): string {
  const statusMessages: Record<string, { emoji: string; title: string; message: string }> = {
    confirmed: {
      emoji: "✅",
      title: "Order Confirmed",
      message: "Your order has been confirmed and queued for preparation.",
    },
    preparing: {
      emoji: "👨‍🍳",
      title: "Being Prepared",
      message: "Our talented team is now preparing your fresh, delicious meal.",
    },
    ready: {
      emoji: "📦",
      title: "Ready for Pickup/Delivery",
      message: "Your order is ready and waiting for you!",
    },
    out_for_delivery: {
      emoji: "🚚",
      title: "Out for Delivery",
      message: "Your order is on its way and should arrive soon.",
    },
    delivered: {
      emoji: "🎉",
      title: "Delivered",
      message: "Your order has been delivered. We hope you enjoy it!",
    },
    cancelled: {
      emoji: "❌",
      title: "Order Cancelled",
      message: "Your order has been cancelled. Contact us if you need anything.",
    },
  };

  const status = statusMessages[newStatus] || {
    emoji: "📋",
    title: "Status Updated",
    message: "Your order status has been updated.",
  };

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0f0f0f; border: 1px solid #1a1a1a;">
      <!-- Header with brand accent -->
      <div style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;"><span style="color: #ffffff;">MAD</span> <span style="color: #75F663;">FRESH</span></h1>
        <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Fresh. Bold. Delivered.</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">
        <h2 style="margin: 0 0 24px; color: #75F663; font-size: 24px; text-align: center;">
          ${status.emoji} ${status.title}
        </h2>

        <p style="margin: 0 0 8px; color: #ffffff;">Hi ${firstName},</p>
        <p style="margin: 0 0 24px; color: #d0d0d0; line-height: 1.6;">
          ${status.message}
        </p>

        <!-- Status info box -->
        <div style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border: 2px solid #75F663; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; color: #aaa; font-size: 12px;">Order Number</p>
          <p style="margin: 0 0 16px; font-size: 24px; color: #75F663; font-weight: 600;">#${orderNumber}</p>
          ${estimatedTime ? `<p style="margin: 0; color: #d0d0d0; font-size: 14px;">
            <strong style="color: #75F663;">⏱️ Estimated:</strong> ${estimatedTime}
          </p>` : ""}
        </div>

        <!-- Call to action -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${orderNumber}" style="display: inline-block; background-color: #2D7A1E; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            View Order Details
          </a>
        </div>
      </div>

      <!-- Footer with food tip -->
      <div style="padding: 24px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a;">
        <div style="border: 2px solid #75F663; border-radius: 8px; padding: 16px; background-color: #0f0f0f; margin-bottom: 16px;">
          <p style="margin: 0; color: #75F663; font-size: 13px; line-height: 1.6;">
            ${getRandomFoodTip(orderNumber)}
          </p>
        </div>

        <p style="margin: 0; text-align: center; color: #666; font-size: 12px;">
          Mad Fresh Kitchen — Fresh. Bold. Delivered.<br />
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
        </p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

/**
 * RSVP confirmation email template
 * Sent when customer confirms attendance for an event
 */
export function rsvpConfirmationEmail({
  firstName,
  eventName,
  eventDate,
  eventTime,
  venueName,
  guestCount,
}: {
  firstName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  guestCount: number;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0f0f0f; border: 1px solid #1a1a1a;">
      <!-- Header with brand accent -->
      <div style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;"><span style="color: #ffffff;">MAD</span> <span style="color: #75F663;">FRESH</span></h1>
        <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Fresh. Bold. Delivered.</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">
        <h2 style="margin: 0 0 24px; color: #75F663; font-size: 20px;">You're In!</h2>

        <p style="margin: 0 0 8px; color: #ffffff;">Hi ${firstName},</p>
        <p style="margin: 0 0 24px; color: #d0d0d0; line-height: 1.6;">
          Thanks for confirming your attendance! We're thrilled to have you and ${guestCount} ${guestCount === 1 ? "guest" : "guests"} at our upcoming event.
        </p>

        <!-- Event details -->
        <div style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border: 2px solid #75F663; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px; color: #75F663; font-size: 18px;">${eventName}</h3>

          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 4px; color: #aaa; font-size: 12px;">📅 Date</p>
            <p style="margin: 0; color: #ffffff; font-size: 16px;">${eventDate}</p>
          </div>

          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 4px; color: #aaa; font-size: 12px;">🕐 Time</p>
            <p style="margin: 0; color: #ffffff; font-size: 16px;">${eventTime}</p>
          </div>

          <div>
            <p style="margin: 0 0 4px; color: #aaa; font-size: 12px;">📍 Location</p>
            <p style="margin: 0; color: #ffffff; font-size: 16px;">${venueName}</p>
          </div>
        </div>

        <!-- Guest count -->
        <div style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #d0d0d0; text-align: center;">
            <strong style="color: #75F663;">${guestCount}</strong> ${guestCount === 1 ? "guest" : "guests"} attending
          </p>
        </div>

        <!-- Call to action -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/events" style="display: inline-block; background-color: #2D7A1E; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            View All Events
          </a>
        </div>

        <p style="margin: 16px 0 0; color: #aaa; font-size: 12px; text-align: center;">
          See you there! Can't wait to share some fresh, bold flavors with you.
        </p>
      </div>

      <!-- Footer with food tip -->
      <div style="padding: 24px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a;">
        <div style="border: 2px solid #75F663; border-radius: 8px; padding: 16px; background-color: #0f0f0f; margin-bottom: 16px;">
          <p style="margin: 0; color: #75F663; font-size: 13px; line-height: 1.6;">
            ${getRandomFoodTip(firstName)}
          </p>
        </div>

        <p style="margin: 0; text-align: center; color: #666; font-size: 12px;">
          Mad Fresh Kitchen — Fresh. Bold. Delivered.<br />
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
        </p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

/**
 * Welcome email template
 * Sent to new customers or newsletter subscribers
 */
export function welcomeEmail({ firstName }: { firstName: string }): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0f0f0f; border: 1px solid #1a1a1a;">
      <!-- Header with brand accent -->
      <div style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;"><span style="color: #ffffff;">MAD</span> <span style="color: #75F663;">FRESH</span></h1>
        <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">Fresh. Bold. Delivered.</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">
        <h2 style="margin: 0 0 24px; color: #75F663; font-size: 20px;">Welcome to Mad Fresh!</h2>

        <p style="margin: 0 0 8px; color: #ffffff;">Hi ${firstName},</p>
        <p style="margin: 0 0 24px; color: #d0d0d0; line-height: 1.6;">
          We're thrilled to have you join the Mad Fresh Kitchen community! You're now part of a movement toward fresh, bold, and delicious food delivered straight to you.
        </p>

        <!-- What's included -->
        <div style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px; color: #75F663; font-size: 16px;">What You Get</h3>

          <div style="margin-bottom: 12px; display: flex; gap: 12px;">
            <span style="color: #75F663; font-size: 18px; flex-shrink: 0;">✨</span>
            <div>
              <p style="margin: 0 0 4px; color: #ffffff; font-weight: 500;">Fresh Meals</p>
              <p style="margin: 0; color: #d0d0d0; font-size: 14px;">Prepared fresh daily with quality ingredients</p>
            </div>
          </div>

          <div style="margin-bottom: 12px; display: flex; gap: 12px;">
            <span style="color: #75F663; font-size: 18px; flex-shrink: 0;">🚚</span>
            <div>
              <p style="margin: 0 0 4px; color: #ffffff; font-weight: 500;">Quick Delivery</p>
              <p style="margin: 0; color: #d0d0d0; font-size: 14px;">Fast, reliable delivery to your door</p>
            </div>
          </div>

          <div style="display: flex; gap: 12px;">
            <span style="color: #75F663; font-size: 18px; flex-shrink: 0;">🎁</span>
            <div>
              <p style="margin: 0 0 4px; color: #ffffff; font-weight: 500;">Exclusive Offers</p>
              <p style="margin: 0; color: #d0d0d0; font-size: 14px;">Subscriber-only deals and special events</p>
            </div>
          </div>
        </div>

        <!-- Call to action -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="display: inline-block; background-color: #2D7A1E; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Start Ordering Now
          </a>
        </div>

        <p style="margin: 16px 0 0; color: #aaa; font-size: 12px; text-align: center;">
          Questions? We're here to help. Just reply to this email.
        </p>
      </div>

      <!-- Footer with food tip -->
      <div style="padding: 24px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a;">
        <div style="border: 2px solid #75F663; border-radius: 8px; padding: 16px; background-color: #0f0f0f; margin-bottom: 16px;">
          <p style="margin: 0; color: #75F663; font-size: 13px; line-height: 1.6;">
            ${getRandomFoodTip(firstName)}
          </p>
        </div>

        <p style="margin: 0; text-align: center; color: #666; font-size: 12px;">
          Mad Fresh Kitchen — Fresh. Bold. Delivered.<br />
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
        </p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

/**
 * Admin account created email template
 * Sent when an admin or team member account is created
 */
export function adminAccountCreatedEmail({
  firstName,
  role,
  loginUrl,
}: {
  firstName: string;
  role: string;
  loginUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; color: #75F663; font-size: 20px; font-weight: 700;">Welcome to the Mad Fresh Kitchen Team</h2>
                <p style="margin: 0 0 24px; color: #888888; font-size: 13px;">Your admin account is ready</p>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  You've been added to the Mad Fresh Kitchen team. Your account has been set up with the following role and you're ready to get started.
                </p>

                <!-- Role badge -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 4px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Your Role</p>
                      <p style="margin: 0; color: #75F663; font-size: 18px; font-weight: 700;">${role}</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 28px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  Use the button below to log in and access your admin dashboard. If you haven't set a password yet, you'll be prompted to create one on your first visit.
                </p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom: 8px;">
                      <a href="${loginUrl}" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        Log In to Dashboard
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0; color: #555555; font-size: 12px; text-align: center;">
                  Or copy this link: <span style="color: #75F663;">${loginUrl}</span>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  This email was sent to you as a new team member. Questions? Reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Staff account created email template
 * Sent when a kitchen staff or driver account is created
 */
export function staffAccountCreatedEmail({
  firstName,
  role,
  loginUrl,
}: {
  firstName: string;
  role: string;
  loginUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; color: #75F663; font-size: 20px; font-weight: 700;">You're on the Crew, ${firstName}!</h2>
                <p style="margin: 0 0 24px; color: #888888; font-size: 13px;">Your staff account has been created</p>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  Welcome to the Mad Fresh Kitchen crew! Your account is set up and ready. You'll use this to manage your shifts, view orders, and stay connected with the team.
                </p>

                <!-- Role badge -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 4px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Your Position</p>
                      <p style="margin: 0; color: #75F663; font-size: 18px; font-weight: 700;">${role}</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 28px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  Tap the button below to log in. If this is your first time, you'll be prompted to set your password. Keep your login info handy — you'll need it for every shift.
                </p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding-bottom: 8px;">
                      <a href="${loginUrl}" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        Access Staff Portal
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0; color: #555555; font-size: 12px; text-align: center;">
                  Or copy this link: <span style="color: #75F663;">${loginUrl}</span>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  Need help? Contact your manager or reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Password reset email template
 * Sent for in-app password reset flows (not Supabase auth)
 */
export function passwordResetEmail({
  firstName,
  resetUrl,
}: {
  firstName: string;
  resetUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 20px; font-weight: 700;">Password Reset Request</h2>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  We received a request to reset the password for your Mad Fresh Kitchen account. Click the button below to choose a new password.
                </p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td align="center">
                      <a href="${resetUrl}" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        Reset My Password
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Warning box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <p style="margin: 0 0 6px; color: #ffffff; font-size: 13px; font-weight: 600;">This link expires in 1 hour</p>
                      <p style="margin: 0; color: #888888; font-size: 13px; line-height: 1.6;">
                        If you didn't request a password reset, you can safely ignore this email. Your password will not change.
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0; color: #555555; font-size: 12px; text-align: center;">
                  Or copy this link: <span style="color: #75F663;">${resetUrl}</span>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  If you need assistance, reply to this email or contact support.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Account activated email template
 * Sent after a user confirms their email or completes account activation
 */
export function accountActivatedEmail({
  firstName,
  dashboardUrl,
}: {
  firstName: string;
  dashboardUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <!-- Active badge -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td align="center">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #0d2b09; border: 1px solid #75F663; border-radius: 100px; padding: 6px 18px;">
                            <p style="margin: 0; color: #75F663; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Account Active</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <h2 style="margin: 0 0 8px; color: #ffffff; font-size: 22px; font-weight: 700; text-align: center;">You're all set, ${firstName}!</h2>
                <p style="margin: 0 0 28px; color: #cccccc; font-size: 14px; line-height: 1.7; text-align: center;">
                  Your Mad Fresh Kitchen account is confirmed and active. Everything is ready for you.
                </p>

                <!-- Feature highlights -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 14px; border-bottom: 1px solid #1a1a1a;">
                            <p style="margin: 0 0 2px; color: #ffffff; font-size: 14px; font-weight: 600;">Order fresh meals</p>
                            <p style="margin: 0; color: #888888; font-size: 13px;">Browse the menu and place orders for delivery or pickup</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 14px 0 14px; border-bottom: 1px solid #1a1a1a;">
                            <p style="margin: 0 0 2px; color: #ffffff; font-size: 14px; font-weight: 600;">Subscribe and save</p>
                            <p style="margin: 0; color: #888888; font-size: 13px;">Set up a weekly meal plan that fits your lifestyle</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 14px;">
                            <p style="margin: 0 0 2px; color: #ffffff; font-size: 14px; font-weight: 600;">Track everything</p>
                            <p style="margin: 0; color: #888888; font-size: 13px;">View order history, manage your account, and more</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${dashboardUrl}" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        Go to Your Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Subscription confirmation email template
 * Sent when a customer creates a meal subscription
 */
export function subscriptionConfirmationEmail({
  firstName,
  planName,
  mealsPerWeek,
  mealSize,
  price,
  billingCycle,
}: {
  firstName: string;
  planName: string;
  mealsPerWeek: number;
  mealSize: string;
  price: number;
  billingCycle: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; color: #75F663; font-size: 20px; font-weight: 700;">Subscription Confirmed!</h2>
                <p style="margin: 0 0 24px; color: #888888; font-size: 13px;">Fresh meals on autopilot</p>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  Your subscription is confirmed and active. Here's a summary of your meal plan:
                </p>

                <!-- Plan details -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 16px; color: #75F663; font-size: 16px; font-weight: 700;">${planName}</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 10px; border-bottom: 1px solid #1a1a1a; padding-top: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #888888; font-size: 13px;">Meals per week</td>
                                <td style="color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${mealsPerWeek}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #1a1a1a;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #888888; font-size: 13px;">Meal size</td>
                                <td style="color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${mealSize}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #1a1a1a;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #888888; font-size: 13px;">Billing cycle</td>
                                <td style="color: #ffffff; font-size: 13px; font-weight: 600; text-align: right;">${billingCycle}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 10px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #888888; font-size: 13px;">Total</td>
                                <td style="color: #75F663; font-size: 16px; font-weight: 700; text-align: right;">$${price.toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- What to expect -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 12px; color: #ffffff; font-size: 14px; font-weight: 600;">What to expect</p>
                      <p style="margin: 0 0 8px; color: #cccccc; font-size: 13px; line-height: 1.6;">
                        Each week, your meals will be freshly prepared and delivered on your chosen schedule. You'll receive a reminder email before each delivery so you can update your preferences or skip a week if needed.
                      </p>
                      <p style="margin: 0; color: #888888; font-size: 12px;">You can manage or cancel your subscription anytime from your account dashboard.</p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/subscription" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        Manage My Subscription
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Subscription cancelled email template
 * Sent when a customer cancels their meal subscription
 */
export function subscriptionCancelledEmail({
  firstName,
  planName,
  endDate,
}: {
  firstName: string;
  planName: string;
  endDate: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 20px; font-weight: 700;">Your subscription has been cancelled</h2>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  We're sorry to see you go. Your <strong style="color: #ffffff;">${planName}</strong> subscription has been cancelled as requested.
                </p>

                <!-- End date box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px; text-align: center;">
                      <p style="margin: 0 0 4px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Access ends on</p>
                      <p style="margin: 0; color: #75F663; font-size: 20px; font-weight: 700;">${endDate}</p>
                      <p style="margin: 8px 0 0; color: #888888; font-size: 13px;">You won't be charged again after this date</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 28px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  We'd love to have you back whenever you're ready. You can restart your subscription at any time and pick up right where you left off. Your account and order history will be saved.
                </p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/subscription" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        Reactivate Anytime
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0; color: #888888; font-size: 13px; text-align: center; line-height: 1.6;">
                  Changed your mind? You can also continue placing individual orders<br />without a subscription — fresh meals are always available.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Donation receipt email template
 * Sent after a customer makes a donation
 */
export function donationReceiptEmail({
  firstName,
  amount,
  mealsEquivalent,
  isAnonymous,
}: {
  firstName: string;
  amount: number;
  mealsEquivalent: number;
  isAnonymous: boolean;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; color: #75F663; font-size: 20px; font-weight: 700;">Thank You${isAnonymous ? "" : `, ${firstName}`}!</h2>
                <p style="margin: 0 0 24px; color: #888888; font-size: 13px;">Your generosity makes a real difference</p>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  We received your donation and we're incredibly grateful. Every dollar goes directly toward providing fresh, nutritious meals to people in our community who need them most.
                </p>

                <!-- Impact box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0d2b09 0%, #0a0a0a 100%); border: 2px solid #75F663; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 24px; text-align: center;">
                      <p style="margin: 0 0 4px; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your donation</p>
                      <p style="margin: 0 0 20px; color: #75F663; font-size: 36px; font-weight: 900;">$${amount.toFixed(2)}</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #1a4d16;">
                        <tr>
                          <td style="padding-top: 20px; text-align: center;">
                            <p style="margin: 0 0 4px; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Meals provided</p>
                            <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900;">${mealsEquivalent}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Receipt details -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <p style="margin: 0 0 8px; color: #ffffff; font-size: 13px; font-weight: 600;">Donation Receipt</p>
                      <p style="margin: 0 0 4px; color: #888888; font-size: 12px;">
                        ${isAnonymous ? "Recorded as an anonymous donation." : `Donated by: ${firstName}`}
                      </p>
                      <p style="margin: 0; color: #888888; font-size: 12px;">Keep this email for your records. Mad Fresh Kitchen is a registered business entity — consult a tax advisor regarding deductibility.</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0; color: #cccccc; font-size: 14px; line-height: 1.7; text-align: center;">
                  Your support helps us keep fresh meals on the table for families and individuals who need it most. Thank you for being part of this mission.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Referral success email template
 * Sent when a referred friend completes sign-up or first order
 */
export function referralSuccessEmail({
  firstName,
  referredName,
  pointsEarned,
}: {
  firstName: string;
  referredName: string;
  pointsEarned: number;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; color: #75F663; font-size: 20px; font-weight: 700;">Your referral worked!</h2>
                <p style="margin: 0 0 24px; color: #888888; font-size: 13px;">You just earned points</p>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  Great news — <strong style="color: #ffffff;">${referredName}</strong> just joined Mad Fresh Kitchen using your referral link. As a thank you, we've added points to your account.
                </p>

                <!-- Points box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0d2b09 0%, #0a0a0a 100%); border: 2px solid #75F663; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 28px; text-align: center;">
                      <p style="margin: 0 0 4px; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Points earned</p>
                      <p style="margin: 0; color: #75F663; font-size: 48px; font-weight: 900; line-height: 1;">${pointsEarned}</p>
                      <p style="margin: 8px 0 0; color: #888888; font-size: 13px;">Added to your account</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 28px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  Use your points toward future orders or continue referring friends to keep earning. The more you share, the more you save.
                </p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/rewards" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        View My Rewards
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Weekly order reminder email template
 * Sent to subscribers ahead of their weekly delivery
 */
export function weeklyOrderReminderEmail({
  firstName,
  deliveryDay,
  menuUrl,
}: {
  firstName: string;
  deliveryDay: string;
  menuUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #111111; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0a0a0a 0%, #121212 100%); border-bottom: 3px solid #75F663; padding: 32px 32px 28px; text-align: center;">
                <p style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                  <span style="color: #ffffff;">MAD</span>&nbsp;<span style="color: #75F663;">FRESH</span>
                </p>
                <p style="margin: 6px 0 0; color: #888888; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">KITCHEN</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 8px; color: #75F663; font-size: 20px; font-weight: 700;">Your meals are being prepared</h2>
                <p style="margin: 0 0 24px; color: #888888; font-size: 13px;">Weekly delivery reminder</p>

                <p style="margin: 0 0 8px; color: #ffffff; font-size: 15px;">Hi ${firstName},</p>
                <p style="margin: 0 0 24px; color: #cccccc; font-size: 14px; line-height: 1.7;">
                  Just a heads-up — your kitchen crew is getting to work on this week's meals. Your delivery is scheduled for <strong style="color: #ffffff;">${deliveryDay}</strong>.
                </p>

                <!-- Delivery day callout -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px; text-align: center;">
                      <p style="margin: 0 0 4px; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Delivery day</p>
                      <p style="margin: 0; color: #75F663; font-size: 22px; font-weight: 700;">${deliveryDay}</p>
                    </td>
                  </tr>
                </table>

                <!-- Helpful info -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; margin-bottom: 28px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 12px; color: #ffffff; font-size: 14px; font-weight: 600;">Before your delivery</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 10px; border-bottom: 1px solid #1a1a1a; padding-top: 0;">
                            <p style="margin: 0; color: #cccccc; font-size: 13px; line-height: 1.6;">
                              <strong style="color: #ffffff;">Check this week's menu</strong> — see exactly what's coming and get excited.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #1a1a1a;">
                            <p style="margin: 0; color: #cccccc; font-size: 13px; line-height: 1.6;">
                              <strong style="color: #ffffff;">Skip this week?</strong> — You can pause your delivery up to 24 hours before your delivery day.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 10px;">
                            <p style="margin: 0; color: #cccccc; font-size: 13px; line-height: 1.6;">
                              <strong style="color: #ffffff;">Update your address</strong> — Make sure your delivery details are current.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${menuUrl}" style="display: inline-block; background-color: #75F663; color: #0a0a0a; padding: 0 36px; height: 48px; line-height: 48px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">
                        See This Week's Menu
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 20px 0 0; color: #888888; font-size: 13px; text-align: center;">
                  Manage your subscription at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/subscription" style="color: #75F663; text-decoration: none;">your account</a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 20px 32px; background-color: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0; color: #555555; font-size: 12px; line-height: 1.6;">
                  Mad Fresh Kitchen — Fresh meals, delivered.<br />
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #75F663; text-decoration: none;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}
