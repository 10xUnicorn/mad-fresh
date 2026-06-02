"use server";

/**
 * Server actions for sending emails from client components.
 * These run on the server so they can access INTERNAL_API_SECRET
 * and call the internal email API routes securely.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://madfresh.app";

async function internalFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[internalFetch] ${path} failed: ${res.status} — ${text}`);
    throw new Error(`Internal API ${path} returned ${res.status}`);
  }

  return res;
}

export async function sendOrderConfirmationEmail(data: {
  orderId: string | null;
  orderNumber: string;
  email: string;
  firstName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  subscriptionDiscount?: number;
  couponCode?: string;
  deliveryFee: number;
  tax: number;
  total: number;
  fulfillmentType: string;
  scheduledFor: string;
  timeSlot: string;
}) {
  try {
    await internalFetch("/api/send-order-confirmation", data);
  } catch {
    // Don't throw — email failure shouldn't break checkout
    console.error("Failed to send order confirmation email");
  }
}

export async function sendRsvpConfirmationEmail(data: {
  firstName: string;
  email: string;
  guestCount: number;
  eventId?: string;
}) {
  try {
    await internalFetch("/api/send-rsvp-confirmation", data);
  } catch {
    console.error("Failed to send RSVP confirmation email");
  }
}
