import { NextRequest, NextResponse } from "next/server";
import { getStripeForStore, toCents } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

// POST: Create a Stripe invoice for a catering order
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Admin auth check — this route is called from admin UI
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin", "manager"])
      .maybeSingle();
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { cateringOrderId, customerEmail, customerName, daysUntilDue = 7 } = body;

    if (!cateringOrderId || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { stripe, settings } = await getStripeForStore(STORE_ID);

    // Fetch the catering order
    const { data: order, error: orderError } = await supabase
      .from("catering_orders")
      .select("*")
      .eq("id", cateringOrderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Catering order not found" }, { status: 404 });
    }

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName || customerEmail,
        metadata: { store_id: STORE_ID, source: "catering" },
      });
    }

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      metadata: {
        store_id: STORE_ID,
        catering_order_id: cateringOrderId,
        event_name: order.event_name || "",
        event_date: order.event_date || "",
      },
      custom_fields: [
        { name: "Event", value: (order.event_name || "Catering Order").substring(0, 30) },
        ...(order.event_date ? [{ name: "Event Date", value: order.event_date.substring(0, 30) }] : []),
      ],
    });

    // Add line items
    // Main catering charge
    const totalAmount = order.total_amount || order.quoted_amount || 0;
    if (totalAmount > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: toCents(totalAmount),
        currency: settings.currency,
        description: `Catering: ${order.event_name || "Event"} — ${order.guest_count || "N/A"} guests`,
      });
    }

    // Finalize the invoice so it can be sent
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Update catering order with Stripe invoice info
    await supabase
      .from("catering_orders")
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        stripe_payment_link: finalizedInvoice.hosted_invoice_url,
        status: "quoted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", cateringOrderId);

    return NextResponse.json({
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      invoicePdf: finalizedInvoice.invoice_pdf,
      status: finalizedInvoice.status,
    });
  } catch (error: unknown) {
    console.error("Invoice creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
