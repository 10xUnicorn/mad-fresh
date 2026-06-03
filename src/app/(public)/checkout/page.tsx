"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadStripe, Stripe as StripeJS } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ChevronRight, CheckCircle2, Copy, ArrowLeft, Loader2, CreditCard, Shield, Lock } from "lucide-react";
import OrderModifier from "@/components/customer/OrderModifier";
import { sendOrderConfirmationEmail } from "@/app/actions/send-emails";

// ── Types ──
interface CartItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  fulfillment_type: "pickup" | "delivery";
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  pickupDate: string;
  timeSlot: "morning" | "afternoon" | "evening";
}

interface PaymentConfig {
  publishableKey: string | null;
  taxRate: number;
  deliveryFee: number;
  freeDeliveryMinimum: number;
  tipEnabled: boolean;
  tipPresets: number[];
}

// ── Stripe Payment Form (used inside Elements provider) ──
function StripePaymentForm({
  total,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
  isFreeOrder = false,
}: {
  total: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  isFreeOrder?: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);

    if (isFreeOrder) {
      // $0 order — use confirmSetup to save card without charging
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        onError(result.error.message || "Failed to save card. Please try again.");
        setIsSubmitting(false);
      } else {
        // SetupIntent succeeded — card saved
        const siId = result.setupIntent?.id || "free_order";
        onSuccess(`setup_${siId}`);
      }
    } else {
      // Normal paid order
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Payment failed. Please try again.");
        setIsSubmitting(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6">
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: { billingDetails: { address: { country: "US" } } },
          }}
        />
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-6 text-xs text-[#9a9080]">
        <div className="flex items-center gap-1.5">
          <Lock size={14} />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={14} />
          <span>PCI Compliant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard size={14} />
          <span>Powered by Stripe</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition ${
          isSubmitting
            ? "bg-[#3d6b2a]/50 text-[#1e2d18]/50 cursor-not-allowed"
            : "bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors hover:shadow-lg hover:shadow-[#449531]/20"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock size={18} />
            {isFreeOrder ? "Save Card & Place Order" : `Pay $${total.toFixed(2)}`}
          </>
        )}
      </button>
    </form>
  );
}

// ── Main Checkout Page ──
export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    apt: "",
    city: "",
    state: "",
    zip: "",
    pickupDate: (() => {
      const now = new Date();
      // If after 4pm, default to tomorrow
      if (now.getHours() >= 16) {
        now.setDate(now.getDate() + 1);
      }
      return now.toISOString().split("T")[0];
    })(),
    timeSlot: "morning",
  });
  const [isSubscription, setIsSubscription] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCopied, setCouponCopied] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Stripe state
  const [stripePromise, setStripePromise] = useState<Promise<StripeJS | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isFreeOrder, setIsFreeOrder] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    publishableKey: null,
    taxRate: 0.085,
    deliveryFee: 5.99,
    freeDeliveryMinimum: 40,
    tipEnabled: true,
    tipPresets: [10, 15, 20, 25],
  });

  // Load cart + payment config
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check URL params first (from dashboard inline ordering)
    const params = new URLSearchParams(window.location.search);
    const urlItems = params.get("items");

    if (urlItems) {
      try {
        const parsed: CartItem[] = JSON.parse(decodeURIComponent(urlItems));
        // Ensure each item has fulfillment_type (dashboard items may not)
        const normalized = parsed.map((item) => ({
          ...item,
          fulfillment_type: item.fulfillment_type || ("pickup" as const),
        }));
        setCart(normalized);
        // Sync to localStorage so rest of checkout logic works
        localStorage.setItem("cart", JSON.stringify(normalized));
        // Clean URL to avoid stale cart on refresh
        window.history.replaceState({}, "", "/checkout");
      } catch {
        setCart([]);
      }
    } else {
      // 2. Fallback to localStorage (from menu page ordering)
      try {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) setCart(JSON.parse(storedCart));
      } catch {
        setCart([]);
      }
    }

    // Fetch payment config
    fetch("/api/payment-config")
      .then((r) => r.json())
      .then((config) => {
        setPaymentConfig(config);
        if (config.publishableKey) {
          setStripePromise(loadStripe(config.publishableKey));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Calculations
  const hasDelivery = cart.some((item) => item.fulfillment_type === "delivery");
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subscriptionDiscount = isSubscription ? subtotal * 0.15 : 0;
  const couponDiscount = appliedCoupon?.applied_discount || 0;
  const totalDiscount = Math.min(subscriptionDiscount + couponDiscount, subtotal); // Never exceed subtotal
  const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
  const rawDeliveryFee = hasDelivery ? paymentConfig.deliveryFee : 0;
  const deliveryFee =
    paymentConfig.freeDeliveryMinimum && subtotalAfterDiscount >= paymentConfig.freeDeliveryMinimum
      ? 0
      : rawDeliveryFee;
  const tax = subtotalAfterDiscount * paymentConfig.taxRate;
  const total = Math.max(0, subtotalAfterDiscount + deliveryFee + tax);

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) return false;
    if (hasDelivery && (!formData.streetAddress || !formData.city || !formData.state || !formData.zip)) return false;
    if (!formData.pickupDate || !formData.timeSlot) return false;
    return true;
  };

  // Create PaymentIntent when user moves to Step 3
  const createPaymentIntent = useCallback(async () => {
    setPaymentError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerPhone: formData.phone,
          fulfillmentType: hasDelivery ? "delivery" : "pickup",
          isSubscription,
          couponCode: appliedCoupon?.code || null,
          scheduledFor: formData.pickupDate,
          timeSlot: formData.timeSlot,
          deliveryAddress: hasDelivery ? {
            street: formData.streetAddress,
            apt: formData.apt,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setIsFreeOrder(data.isFreeOrder || false);
      setStripeCustomerId(data.customerId || null);

      // Store server-created order info for confirmation page
      if (data.orderId) setOrderId(data.orderId);
      if (data.orderNumber) setOrderNumber(data.orderNumber);

      // If publishable key came from the server, use it
      if (data.publishableKey && !stripePromise) {
        setStripePromise(loadStripe(data.publishableKey));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize payment";
      setPaymentError(msg);
    }
  }, [cart, formData, hasDelivery, isSubscription, stripePromise, appliedCoupon, couponDiscount]);

  const handleGoToPayment = async () => {
    if (!validateStep1()) return;
    setStep(3);
    await createPaymentIntent();
  };

  // After successful payment — order already exists server-side, just send email + redirect
  const handlePaymentSuccess = async (_piId: string) => {
    try {
      // Send order confirmation email (fire and forget via server action)
      // Order was already created server-side in /api/checkout
      sendOrderConfirmationEmail({
        orderId: orderId || null,
        orderNumber: orderNumber || `MF-${Date.now()}`,
        email: formData.email,
        firstName: formData.firstName,
        items: cart.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        subtotal,
        discount: totalDiscount,
        subscriptionDiscount,
        couponCode: appliedCoupon?.code,
        deliveryFee,
        tax,
        total,
        fulfillmentType: hasDelivery ? "delivery" : "pickup",
        scheduledFor: formData.pickupDate,
        timeSlot: formData.timeSlot,
      }).catch(() => {}); // Don't block on email failure

      // Increment promo/coupon usage client-side (non-critical)
      if (appliedCoupon?.promo_id) {
        try {
          const supabase = createClient();
          if (appliedCoupon.source === "promotions") {
            await supabase.rpc("increment_promo_usage", { promo_uuid: appliedCoupon.promo_id });
          } else {
            await supabase.rpc("increment_coupon_usage", { coupon_uuid: appliedCoupon.promo_id });
          }
        } catch { /* non-critical */ }
      }

      setStep(4);
      localStorage.removeItem("cart");
    } catch (error) {
      console.error("Error in post-payment handler:", error);
      // Payment succeeded — still show confirmation
      setStep(4);
      localStorage.removeItem("cart");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          subtotal,
          user_id: formData.email, // Use email as user identifier
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.message || "Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data);
      setCouponError(null);
    } catch (error) {
      console.error("Coupon validation error:", error);
      setCouponError("Failed to validate coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };


  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
      </main>
    );
  }

  if (cart.length === 0 && step < 4) {
    return (
      <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-3xl font-bold text-[#1e2d18]">Your cart is empty</h1>
          <p className="text-[#7a7060]">Add items to your cart before checking out.</p>
          <Link
            href="/menu"
            className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold min-h-[44px]"
          >
            <ArrowLeft size={18} />
            Back to Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {step < 4 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {[
                { num: 1, label: "Contact" },
                { num: 2, label: "Review" },
                { num: 3, label: "Payment" },
                { num: 4, label: "Confirm" },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                        step >= s.num
                          ? "bg-[#3d6b2a] text-white"
                          : "bg-[#f2efe8] text-[#7a7060] border border-[#ddd8cc]"
                      }`}
                    >
                      {step > s.num ? <CheckCircle2 size={24} /> : s.num}
                    </div>
                    <p className="text-xs text-[#7a7060] mt-2">{s.label}</p>
                  </div>
                  {i < 3 && (
                    <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? "bg-[#3d6b2a]" : "bg-[#f2efe8]"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ Step 1: Contact Info ══ */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1e2d18] mb-2">Contact Information</h2>
              <p className="text-[#7a7060]">Help us reach you about your order</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">First Name</label>
                <input type="text" value={formData.firstName} onChange={(e) => handleFormChange("firstName", e.target.value)}
                  className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">Last Name</label>
                <input type="text" value={formData.lastName} onChange={(e) => handleFormChange("lastName", e.target.value)}
                  className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="Doe" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">Email</label>
                <input type="email" value={formData.email} onChange={(e) => handleFormChange("email", e.target.value)}
                  className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => handleFormChange("phone", e.target.value)}
                  className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="(555) 123-4567" />
              </div>
            </div>

            {hasDelivery && (
              <>
                <h3 className="text-xl font-bold text-[#1e2d18]">Delivery Address</h3>
                <div>
                  <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">Street Address</label>
                  <input type="text" value={formData.streetAddress} onChange={(e) => handleFormChange("streetAddress", e.target.value)}
                    className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="123 Main St" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">Apt/Suite</label>
                    <input type="text" value={formData.apt} onChange={(e) => handleFormChange("apt", e.target.value)}
                      className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="Apt 4B" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">City</label>
                    <input type="text" value={formData.city} onChange={(e) => handleFormChange("city", e.target.value)}
                      className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="Tempe" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">State</label>
                    <input type="text" value={formData.state} onChange={(e) => handleFormChange("state", e.target.value)}
                      className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="AZ" maxLength={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">ZIP</label>
                    <input type="text" value={formData.zip} onChange={(e) => handleFormChange("zip", e.target.value)}
                      className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" placeholder="85281" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#1e2d18]">Preferred Pickup/Delivery</h3>
              <div>
                <label className="block text-sm font-semibold text-[#4a5e3a] mb-2">Date</label>
                <input type="date" value={formData.pickupDate} onChange={(e) => handleFormChange("pickupDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] text-base focus:outline-none focus:ring-2 focus:ring-[#449531]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4a5e3a] mb-3">Time Slot</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {(["morning", "afternoon", "evening"] as const).map((slot) => (
                    <button key={slot} onClick={() => handleFormChange("timeSlot", slot)}
                      className={`p-4 rounded-xl border-2 transition font-semibold ${
                        formData.timeSlot === slot
                          ? "border-[#75F663] bg-[#3d6b2a]/10 text-[#1e2d18]"
                          : "border-[#ddd8cc] bg-white text-[#4a5e3a] hover:border-[#ddd8cc]"
                      }`}
                    >
                      {slot === "morning" ? "Morning (9am-12pm)" : slot === "afternoon" ? "Afternoon (12pm-3pm)" : "Evening (3pm-6pm)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-8">
              <Link href="/cart" className="flex items-center gap-2 px-6 py-3 rounded-full text-[#7a7060] hover:text-[#1e2d18] transition min-h-[44px]">
                <ArrowLeft size={18} /> Back
              </Link>
              <button
                onClick={() => validateStep1() && setStep(2)}
                disabled={!validateStep1()}
                className={`flex-1 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition min-h-[44px] ${
                  validateStep1() ? "bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors" : "bg-white text-[#7a7060] cursor-not-allowed"
                }`}
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ══ Step 2: Review ══ */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1e2d18] mb-2">Review Your Order</h2>
              <p className="text-[#7a7060]">Confirm your items before payment</p>
            </div>

            <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-[#1e2d18]">Order Items</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={`${item.recipe_id}-${item.fulfillment_type}`} className="flex justify-between items-center pb-3 border-b border-[#ddd8cc] last:border-b-0">
                    <div>
                      <p className="text-[#1e2d18] font-semibold">{item.name}</p>
                      <p className="text-xs text-[#7a7060] mt-1">
                        <span className="inline-block px-2 py-0.5 bg-[#3d6b2a]/20 text-[#3d6b2a] rounded text-xs mr-2">
                          {item.fulfillment_type === "pickup" ? "Pickup" : "Delivery"}
                        </span>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-[#1e2d18] font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-[#ddd8cc]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7a7060]">Subtotal</span>
                  <span className="text-[#1e2d18]">${subtotal.toFixed(2)}</span>
                </div>
                {isSubscription && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7060]">Founding Member Discount (15%)</span>
                    <span className="text-[#3d6b2a]">-${subscriptionDiscount.toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7060]">Coupon Discount ({appliedCoupon.code})</span>
                    <span className="text-[#3d6b2a]">-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {hasDelivery && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7060]">Delivery Fee</span>
                    <span className="text-[#1e2d18]">{deliveryFee === 0 ? <span className="text-[#3d6b2a]">FREE</span> : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#7a7060]">Tax ({(paymentConfig.taxRate * 100).toFixed(1)}%)</span>
                  <span className="text-[#1e2d18]">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#ddd8cc]">
                  <span className="text-[#1e2d18] font-bold">Total</span>
                  <span className="text-2xl font-bold text-[#3d6b2a]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="rounded-2xl p-6 border border-[#ddd8cc] bg-white backdrop-blur-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1e2d18] mb-1">Have a Coupon Code?</h3>
                  <p className="text-sm text-[#7a7060]">Apply a promo code to your order</p>
                </div>

                {appliedCoupon ? (
                  <div className="bg-[#3d6b2a]/10 border border-[#75F663]/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#7a7060]">Applied Coupon</p>
                        <p className="text-xl font-bold text-[#3d6b2a] mt-1">{appliedCoupon.code}</p>
                        {appliedCoupon.description && (
                          <p className="text-xs text-[#7a7060] mt-1">{appliedCoupon.description}</p>
                        )}
                        <p className="text-sm text-[#3d6b2a] font-semibold mt-2">
                          Saves you ${appliedCoupon.applied_discount?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="px-4 py-2 text-sm font-semibold text-[#7a7060] hover:text-[#1e2d18] transition rounded-lg hover:bg-[#f2efe8]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                        placeholder="Enter coupon code"
                        className="flex-1 bg-white border border-[#ddd8cc] rounded-lg px-4 py-3 text-[#1e2d18] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#449531]"
                        disabled={couponLoading}
                      />
                      <button
                        onClick={validateCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
                          couponLoading
                            ? "bg-[#f2efe8] text-[#7a7060] cursor-not-allowed"
                            : couponCode.trim()
                            ? "bg-[#3d6b2a] text-black hover:bg-[#3d6b2a]"
                            : "bg-[#f2efe8] text-[#9a9080] cursor-not-allowed"
                        }`}
                      >
                        {couponLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Checking...
                          </>
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>

                    {couponError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{couponError}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Subscription Upsell */}
            <div className={`rounded-2xl p-6 border-2 transition ${
              isSubscription
                ? "border-[#75F663] bg-[#3d6b2a]/5"
                : "border-[#449531] bg-[#3d6b2a]/10 hover:border-[#75F663] hover:bg-[#3d6b2a]/5"
            }`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-[#3d6b2a] mb-2">Save 15% Every Week</h3>
                  <p className="text-[#4a5e3a]">Convert to a weekly subscription and lock in founding member pricing.</p>
                </div>
                <button
                  onClick={() => setIsSubscription(!isSubscription)}
                  className={`w-full py-3 rounded-full font-bold transition ${
                    isSubscription
                      ? "bg-[#3d6b2a] text-black hover:bg-[#3d6b2a]"
                      : "bg-transparent border-2 border-[#75F663] text-[#3d6b2a] hover:bg-[#3d6b2a]/10"
                  }`}
                >
                  {isSubscription ? "✓ Weekly Subscription Selected" : "Upgrade to Weekly Subscription"}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-8">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-3 rounded-full text-[#7a7060] hover:text-[#1e2d18] transition">
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={handleGoToPayment}
                className="flex-1 py-3 rounded-full font-bold bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2 transition"
              >
                Continue to Payment <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ══ Step 3: Stripe Payment ══ */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1e2d18] mb-2">Secure Payment</h2>
              <p className="text-[#7a7060]">Your payment is encrypted and secure</p>
            </div>

            {/* Order total reminder */}
            <div className="bg-white border border-[#ddd8cc] rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-[#7a7060]">{isFreeOrder ? "Free Order — Save Card for Tips" : "Order Total"}</p>
                <p className="text-2xl font-bold text-[#3d6b2a]">{isFreeOrder ? "FREE" : `$${total.toFixed(2)}`}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#7a7060]">{cart.reduce((s, i) => s + i.quantity, 0)} items</p>
                <p className="text-xs text-[#9a9080]">{hasDelivery ? "Delivery" : "Pickup"}</p>
              </div>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{paymentError}</p>
                <button onClick={createPaymentIntent} className="text-red-600 underline text-sm mt-2">
                  Try again
                </button>
              </div>
            )}

            {clientSecret && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#3d6b2a",
                      colorBackground: "#ffffff",
                      colorText: "#1e2d18",
                      colorDanger: "#dc2626",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      borderRadius: "12px",
                      spacingUnit: "4px",
                    },
                    rules: {
                      ".Input": {
                        border: "1px solid #ddd8cc",
                        boxShadow: "none",
                        backgroundColor: "#ffffff",
                      },
                      ".Input:focus": {
                        border: "1px solid #3d6b2a",
                        boxShadow: "0 0 0 1px #3d6b2a",
                      },
                      ".Tab": {
                        border: "1px solid #ddd8cc",
                        backgroundColor: "#faf8f3",
                      },
                      ".Tab--selected": {
                        border: "1px solid #3d6b2a",
                        backgroundColor: "#e9f0e4",
                      },
                    },
                  },
                }}
              >
                <StripePaymentForm
                  total={total}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                  onSuccess={handlePaymentSuccess}
                  onError={(msg) => setPaymentError(msg)}
                  isFreeOrder={isFreeOrder}
                />
              </Elements>
            ) : !paymentError ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
                <p className="text-[#7a7060] ml-3">Preparing secure payment...</p>
              </div>
            ) : null}

            <button onClick={() => { setStep(2); setClientSecret(null); }}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-[#7a7060] hover:text-[#1e2d18] transition">
              <ArrowLeft size={18} /> Back to Review
            </button>
          </div>
        )}

        {/* ══ Step 4: Confirmation ══ */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-center pt-8">
              <div className="relative">
                <div className="absolute inset-0 bg-[#3d6b2a] rounded-full opacity-20 animate-pulse" />
                <CheckCircle2 size={120} className="text-[#3d6b2a] relative" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-[#1e2d18]">Order Confirmed!</h2>
              <p className="text-[#7a7060]">Payment received. We&apos;ll have it ready soon.</p>
            </div>

            <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm text-[#7a7060]">Order Number</p>
              <p className="text-3xl font-bold text-[#3d6b2a] font-mono">{orderNumber}</p>
            </div>

            <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-[#1e2d18]">What You Ordered</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={`${item.recipe_id}-${item.fulfillment_type}`} className="flex justify-between text-sm">
                    <span className="text-[#4a5e3a]">{item.quantity}x {item.name}</span>
                    <span className="text-[#1e2d18]">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#ddd8cc] pt-4 flex justify-between font-bold">
                <span className="text-[#1e2d18]">Total Paid</span>
                <span className="text-[#3d6b2a]">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-2xl p-6 space-y-4">
              <p className="text-sm text-[#7a7060]">Your next order coupon</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-2xl font-bold text-[#3d6b2a]">MADFRESH10</p>
                  <p className="text-xs text-[#7a7060]">10% off your next order</p>
                </div>
                <button onClick={() => copyToClipboard("MADFRESH10")}
                  className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
                    couponCopied ? "bg-[#3d6b2a] text-white" : "bg-[#f2efe8] hover:bg-[#e9f0e4] text-[#1e2d18]"
                  }`}>
                  <Copy size={16} /> {couponCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Post-Order Modifications: Tip + Add Items */}
            {orderId && (
              <OrderModifier orderId={orderId} variant="full" />
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/menu"
                className="flex-1 py-3 rounded-full font-bold bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2 transition">
                Browse More Meals <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
