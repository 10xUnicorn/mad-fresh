"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import {
  Pause,
  Play,
  XCircle,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Check,
  Utensils,
  ArrowLeft,
  Crown,
  Zap,
  Shirt,
  Droplets,
  Gift,
  Star,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// ─── Types ───────────────────────────────────────────────
interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_interval: string;
  current_price: number;
  next_billing_date: string;
  next_delivery_date: string;
  delivery_day: string;
  is_founding_member: boolean;
  paused_until: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

interface MacroRange {
  calories: number[] | string;
  protein: number[] | string;
  carbs: number[] | string;
  fat: number[] | string;
}

/** Format a macro value from DB array [350, 450] → "350–450" or passthrough string */
function formatMacro(val: number[] | string | undefined, suffix = ""): string {
  if (!val) return "—";
  if (Array.isArray(val)) {
    if (val.length === 2) return `${val[0]}–${val[1]}${suffix}`;
    return `${val[0]}${suffix}`;
  }
  return `${val}${suffix}`;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  meals_per_week: number;
  price_weekly: number;
  price_monthly: number;
  price_annual: number;
  meal_size?: string | null;
  protein_options?: string[] | null;
  macros_small?: MacroRange | null;
  macros_medium?: MacroRange | null;
  macros_large?: MacroRange | null;
  annual_bonus_merch?: string | null;
  annual_bonus_description?: string | null;
  price_small_modifier?: number | null;
  price_large_modifier?: number | null;
}

type MealSize = "small" | "medium" | "large";
type BillingInterval = "weekly" | "monthly" | "annual";

const PROTEIN_OPTIONS = [
  "Grilled Chicken Breast",
  "Grilled Chicken Thigh",
  "Steak",
  "Salmon",
  "Shrimp",
  "Ground Turkey",
] as const;
type Protein = (typeof PROTEIN_OPTIONS)[number];

const MERCH_VALUE = 387; // $150 merch + 3×$79 gift cards

// ─── Helpers ─────────────────────────────────────────────
function getMacros(plan: SubscriptionPlan, size: MealSize): MacroRange | null {
  if (size === "small") return plan.macros_small ?? null;
  if (size === "large") return plan.macros_large ?? null;
  return plan.macros_medium ?? null;
}

function getBasePrice(plan: SubscriptionPlan, interval: BillingInterval): number {
  if (interval === "weekly") return plan.price_weekly;
  if (interval === "monthly") return plan.price_monthly;
  return plan.price_annual;
}

function getSizeModifier(plan: SubscriptionPlan, size: MealSize): number {
  if (size === "small") return plan.price_small_modifier ?? 0.85;
  if (size === "large") return plan.price_large_modifier ?? 1.2;
  return 1.0;
}

function calcPrice(plan: SubscriptionPlan, interval: BillingInterval, size: MealSize): number {
  return getBasePrice(plan, interval) * getSizeModifier(plan, size);
}

// ─── Component ───────────────────────────────────────────
export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Multi-step selection state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<MealSize | null>(null);
  const [selectedProteins, setSelectedProteins] = useState<Protein[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup" | null>(null);
  const [pickupDay, setPickupDay] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval | null>(null);
  // Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("customer_id", user.id)
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (subs && subs.length > 0) {
      setSubscription(subs[0]);
      const { data: planData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", subs[0].plan_id)
        .single();
      if (planData) setActivePlan(planData);
    }

    const { data: plans } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .eq("is_active", true)
      .order("sort_order");

    if (plans) {
      setAllPlans(plans);
      // Default to 10 meals/week plan
      const tenMealPlan = plans.find(p => p.meals_per_week === 10);
      if (tenMealPlan) setSelectedPlanId(tenMealPlan.id);
      else if (plans.length > 1) setSelectedPlanId(plans[1].id);
      else if (plans.length > 0) setSelectedPlanId(plans[0].id);
    }
    setIsLoading(false);
  };

  // ─── Subscription Management ─────────────────────────
  const handlePause = async () => {
    if (!subscription) return;
    setActionLoading("pause");
    try {
      const res = await fetch("/api/subscriptions/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id, action: "pause" }),
      });
      if (!res.ok) { const d = await res.json(); console.error("Pause failed:", d.error); setActionLoading(null); return; }
      const pauseUntil = new Date();
      pauseUntil.setDate(pauseUntil.getDate() + 7);
      setSubscription({ ...subscription, status: "paused", paused_until: pauseUntil.toISOString() });
    } catch (err) { console.error("Pause error:", err); }
    setActionLoading(null);
  };

  const handleResume = async () => {
    if (!subscription) return;
    setActionLoading("resume");
    try {
      const res = await fetch("/api/subscriptions/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id, action: "resume" }),
      });
      if (!res.ok) { const d = await res.json(); console.error("Resume failed:", d.error); setActionLoading(null); return; }
      setSubscription({ ...subscription, status: "active", paused_until: null });
    } catch (err) { console.error("Resume error:", err); }
    setActionLoading(null);
  };

  const handleCancel = async () => {
    if (!subscription) return;
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/subscriptions/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id, action: "cancel" }),
      });
      if (!res.ok) { const d = await res.json(); console.error("Cancel failed:", d.error); setActionLoading(null); return; }
      setSubscription(null);
      setShowCancelConfirm(false);
    } catch (err) { console.error("Cancel error:", err); }
    setActionLoading(null);
  };

  // ─── Checkout ────────────────────────────────────────
  const fetchClientSecret = useCallback(async () => {
    if (!selectedPlanId || !billingInterval) throw new Error("Incomplete selection");
    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: selectedPlanId,
        billingInterval,
        mealSize: selectedSize,
        proteinPreferences: selectedProteins,
        deliveryMethod,
        pickupDay: deliveryMethod === "pickup" ? pickupDay : "Sunday",
        pickupTime: deliveryMethod === "pickup" ? pickupTime : null,
        repeatMeals: false,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setCheckoutError(data.error || "Failed to start checkout"); throw new Error(data.error); }
    return data.clientSecret;
  }, [selectedPlanId, billingInterval, selectedSize, selectedProteins, deliveryMethod, pickupDay, pickupTime]);

  // ─── Derived ─────────────────────────────────────────
  const selectedPlan = allPlans.find((p) => p.id === selectedPlanId) ?? null;
  const canProceed = selectedPlanId && selectedSize && deliveryMethod && billingInterval;

  function displayPrice(plan: SubscriptionPlan, interval: BillingInterval, size: MealSize) {
    const p = calcPrice(plan, interval, size);
    if (interval === "annual") return `$${p.toFixed(0)}/yr`;
    if (interval === "monthly") return `$${p.toFixed(0)}/mo`;
    return `$${p.toFixed(0)}/wk`;
  }

  // Annual value calc for Hormozi block
  function getAnnualValueBlock(plan: SubscriptionPlan, size: MealSize) {
    const annualPrice = calcPrice(plan, "annual", size);
    const weeklyEquiv = calcPrice(plan, "weekly", size);
    const yearlyAtWeekly = weeklyEquiv * 52;
    const totalValue = yearlyAtWeekly + MERCH_VALUE;
    const savings = totalValue - annualPrice;
    return { annualPrice, totalValue, savings };
  }

  // ─── Loading ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
      </div>
    );
  }

  // ─── Checkout View ────────────────────────────────────
  if (showCheckout && selectedPlanId && selectedSize && billingInterval) {
    const price = selectedPlan ? displayPrice(selectedPlan, billingInterval, selectedSize) : "";
    return (
      <div className="space-y-6 min-w-0">
        <button
          onClick={() => { setShowCheckout(false); setCheckoutError(""); }}
          className="flex items-center gap-2 text-[#7a7060] hover:text-[#1e2d18] transition text-sm min-h-[44px]"
        >
          <ArrowLeft size={16} /> Back to plans
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18]">Complete Your Subscription</h1>
          <p className="text-[#7a7060] text-sm mt-1">
            {selectedPlan?.name} · {selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} size · {price}
            {selectedProteins.length > 0 && ` · ${selectedProteins.join(", ")}`}
          </p>
        </div>
        {checkoutError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{checkoutError}</div>
        )}
        <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout className="min-h-[400px]" />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    );
  }

  // ─── Active Subscription View ─────────────────────────
  if (subscription && activePlan) {
    return (
      <div className="space-y-6 min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18]">Subscription</h1>
          <p className="text-[#7a7060] text-sm mt-1">Manage your meal plan</p>
        </div>

        {/* Current Plan Card */}
        <div className={`rounded-2xl p-5 sm:p-6 border ${
          subscription.status === "paused"
            ? "bg-amber-50 border-amber-200"
            : "bg-[#e9f0e4] border-[#3d6b2a]/15"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  subscription.status === "active"
                    ? "bg-[#e9f0e4] text-[#3d6b2a]"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {subscription.status === "paused" ? "Paused" : "Active"}
                </span>
                {subscription.is_founding_member && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#e9f0e4] text-[#3d6b2a]">
                    Founding Member
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#1e2d18]">{activePlan.name}</h2>
              <p className="text-[#7a7060] text-sm">{activePlan.meals_per_week} meals per week</p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-bold text-[#1e2d18]">${subscription.current_price}</p>
              <p className="text-[#9a9080] text-xs">/{subscription.billing_interval}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#f2efe8] rounded-lg p-3">
              <div className="flex items-center gap-2 text-[#7a7060] text-xs mb-1">
                <Calendar size={12} /> Next Delivery
              </div>
              <p className="text-[#1e2d18] font-semibold text-sm">
                {subscription.next_delivery_date
                  ? new Date(subscription.next_delivery_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  : "—"}
              </p>
            </div>
            <div className="bg-[#f2efe8] rounded-lg p-3">
              <div className="flex items-center gap-2 text-[#7a7060] text-xs mb-1">
                <DollarSign size={12} /> Next Billing
              </div>
              <p className="text-[#1e2d18] font-semibold text-sm">
                {subscription.next_billing_date
                  ? new Date(subscription.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          {subscription.status === "paused" && subscription.paused_until && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-700 text-sm">
                Paused until{" "}
                {new Date(subscription.paused_until).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {subscription.status === "active" ? (
            <button
              onClick={handlePause}
              disabled={actionLoading === "pause"}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#f2efe8] border border-[#ddd8cc] text-[#1e2d18] rounded-xl text-sm font-semibold hover:bg-amber-50 hover:border-amber-200 transition disabled:opacity-50 min-h-[44px]"
            >
              {actionLoading === "pause" ? <Loader2 size={16} className="animate-spin" /> : <Pause size={16} />}
              Pause Subscription
            </button>
          ) : (
            <button
              onClick={handleResume}
              disabled={actionLoading === "resume"}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] text-white rounded-xl text-sm font-bold hover:bg-[#2f5720] transition disabled:opacity-50 min-h-[44px]"
            >
              {actionLoading === "resume" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Resume Subscription
            </button>
          )}
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-50 transition min-h-[44px]"
          >
            <XCircle size={16} /> Cancel
          </button>
        </div>

        {/* Cancel Confirmation */}
        {showCancelConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[#1e2d18] font-bold">Cancel your subscription?</h3>
                <p className="text-[#7a7060] text-sm mt-1">
                  You&apos;ll lose access to your meal plan and founding member pricing. This can&apos;t be undone.
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel"}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 min-h-[44px] flex items-center justify-center"
                  >
                    {actionLoading === "cancel" ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-4 py-2 bg-[#f2efe8] text-[#4a5e3a] rounded-lg text-sm hover:bg-[#f0ece3] transition min-h-[44px] flex items-center justify-center"
                  >
                    Keep Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── New Subscription Flow ────────────────────────────
  return (
    <div className="space-y-0 min-w-0 pb-28 sm:pb-20">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Utensils size={18} className="text-[#3d6b2a]" />
          <span className="text-xs font-semibold text-[#3d6b2a] uppercase tracking-widest">Meal Plans</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1e2d18]">Build Your Meal Plan</h1>
        <p className="text-[#7a7060] text-base mt-1">Chef-crafted meals delivered every Sunday. Cancel anytime.</p>
      </div>

      {/* ── STEP 1: Meals per Week ── */}
      <StepSection
        number={1}
        label="How many meals per week?"
        active={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {allPlans.map((plan, idx) => {
            const isSelected = selectedPlanId === plan.id;
            const isPopular = idx === 1;
            const weeklyPrice = plan.price_weekly;
            return (
              <button
                key={plan.id}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  // Reset downstream selections when plan changes
                  setSelectedSize(null);
                  setBillingInterval(null);
                }}
                className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-[#3d6b2a] bg-[#e9f0e4] shadow-lg shadow-[#3d6b2a]/10"
                    : "border-[#ddd8cc] bg-white hover:border-[#9a9080] hover:bg-[#faf8f3]"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#3d6b2a] text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Zap size={9} /> Most Popular
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-5 h-5 bg-[#3d6b2a] rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <p className="text-4xl font-black text-[#1e2d18] mb-0.5">{plan.meals_per_week}</p>
                <p className="text-base text-[#7a7060] mb-3">meals / week</p>
                <p className="text-[#3d6b2a] font-bold text-xl">
                  ${weeklyPrice.toFixed(0)}
                  <span className="text-[#9a9080] font-normal text-sm">/wk</span>
                </p>
                <p className="text-[#9a9080] text-sm mt-0.5">
                  ~${(weeklyPrice / plan.meals_per_week).toFixed(2)}/meal
                </p>
              </button>
            );
          })}
        </div>
      </StepSection>

      {/* ── STEP 2: Meal Size ── */}
      {selectedPlan && (
        <StepSection number={2} label="Choose your meal size" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["small", "medium", "large"] as MealSize[]).map((size) => {
              const isSelected = selectedSize === size;
              const macros = getMacros(selectedPlan, size);
              const modifier = getSizeModifier(selectedPlan, size);
              const adjPrice = selectedPlan.price_weekly * modifier;
              const labels: Record<MealSize, { title: string; sub: string; detail: string; icon: string }> = {
                small: { title: "Small", sub: "Light & Lean", detail: "Portion-controlled for cutting or lighter appetites", icon: "S" },
                medium: { title: "Medium", sub: "Balanced Fuel", detail: "Balanced macro bowl for daily energy and performance", icon: "M" },
                large: { title: "Large", sub: "Max Fuel", detail: "Extra protein & volume for athletes and big appetites", icon: "L" },
              };
              const label = labels[size];

              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-[#3d6b2a] bg-[#e9f0e4] shadow-lg shadow-[#3d6b2a]/10"
                      : "border-[#ddd8cc] bg-white hover:border-[#9a9080] hover:bg-[#faf8f3]"
                  }`}
                >
                  {size === "medium" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#f2efe8] text-[#4a5e3a] text-[10px] font-bold uppercase tracking-wider rounded-full whitespace-nowrap">
                      Standard
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-5 h-5 bg-[#3d6b2a] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-[#f2efe8] border border-[#ddd8cc] flex items-center justify-center mb-3">
                    <span className="text-[#1e2d18] font-black text-base">{label.icon}</span>
                  </div>
                  <p className="text-[#1e2d18] font-bold text-xl mb-0.5">{label.title}</p>
                  <p className="text-[#3d6b2a] text-sm font-semibold mb-1">{label.sub}</p>
                  <p className="text-[#9a9080] text-xs mb-3 leading-snug">{label.detail}</p>

                  {macros ? (
                    <div className="space-y-1.5">
                      <MacroRow label="Calories" value={formatMacro(macros.calories)} color="text-orange-400" />
                      <MacroRow label="Protein" value={formatMacro(macros.protein, "g")} color="text-blue-400" />
                      <MacroRow label="Carbs" value={formatMacro(macros.carbs, "g")} color="text-yellow-400" />
                      <MacroRow label="Fat" value={formatMacro(macros.fat, "g")} color="text-pink-400" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <MacroRow label="Calories" value={size === "small" ? "350–450" : size === "large" ? "600–750" : "450–600"} color="text-orange-400" />
                      <MacroRow label="Protein" value={size === "small" ? "25–35g" : size === "large" ? "45–55g" : "35–45g"} color="text-blue-400" />
                      <MacroRow label="Carbs" value={size === "small" ? "30–45g" : size === "large" ? "65–90g" : "45–65g"} color="text-yellow-400" />
                      <MacroRow label="Fat" value={size === "small" ? "12–20g" : size === "large" ? "25–40g" : "18–28g"} color="text-pink-400" />
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#ede9e2]">
                    {(() => {
                      const mediumPrice = selectedPlan.price_weekly;
                      const diff = adjPrice - mediumPrice;
                      if (size === "small") {
                        return <p className="text-xs font-semibold text-green-400">${adjPrice.toFixed(0)}/wk · Save ${Math.abs(diff).toFixed(0)}/wk</p>;
                      } else if (size === "large") {
                        return <p className="text-xs font-semibold text-orange-300">${adjPrice.toFixed(0)}/wk · +${diff.toFixed(0)}/wk</p>;
                      }
                      return <p className="text-xs text-[#9a9080]">${adjPrice.toFixed(0)}/wk</p>;
                    })()}
                  </div>
                </button>
              );
            })}
          </div>
        </StepSection>
      )}

      {/* ── STEP 3: Protein Preferences ── */}
      {selectedSize && (
        <StepSection number={3} label="Protein preferences" active={true} optional>
          <p className="text-[#9a9080] text-xs mb-3">Select your preferred proteins — we&apos;ll build your meals around them.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROTEIN_OPTIONS.map((protein) => {
              const isSelected = selectedProteins.includes(protein);
              return (
                <button
                  key={protein}
                  onClick={() => {
                    setSelectedProteins((prev) =>
                      isSelected ? prev.filter((p) => p !== protein) : [...prev, protein]
                    );
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 min-h-[44px] text-left ${
                    isSelected
                      ? "bg-[#e9f0e4] border-[#3d6b2a] text-[#1e2d18]"
                      : "bg-white border-[#ddd8cc] text-[#4a5e3a] hover:border-[#9a9080] hover:text-[#1e2d18]"
                  }`}
                >
                  {isSelected && <Check size={12} className="inline mr-1.5 -mt-0.5 text-[#3d6b2a]" />}
                  {protein}
                </button>
              );
            })}
          </div>
          {selectedProteins.length === 0 && (
            <p className="text-[#9a9080] text-xs mt-2 italic">Skip to receive a variety of all proteins.</p>
          )}
          {/* Next step nudge */}
          <div className="mt-4">
            <button
              onClick={() => {
                const el = document.getElementById("step-4");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex items-center gap-1.5 text-[#3d6b2a] text-sm font-semibold hover:gap-2.5 transition-all"
            >
              Choose delivery <ChevronRight size={16} />
            </button>
          </div>
        </StepSection>
      )}

      {/* ── STEP 4: Delivery or Pickup ── */}
      {selectedSize && (
        <StepSection number={4} label="Delivery or pickup?" active={true} id="step-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {([
              { value: "delivery" as const, label: "Delivery", sub: "Sundays · 4–8 PM", icon: "🚗" },
              { value: "pickup" as const, label: "Pickup", sub: "Any day · Choose your time", icon: "🏪" },
            ]).map(({ value, label, sub, icon }) => {
              const isSelected = deliveryMethod === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    setDeliveryMethod(value);
                    if (value === "delivery") {
                      setPickupDay("Sunday");
                      setPickupTime(null);
                    } else {
                      setPickupDay(null);
                      setPickupTime(null);
                    }
                  }}
                  className={`text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-[#3d6b2a] bg-[#e9f0e4] shadow-lg shadow-[#3d6b2a]/10"
                      : "border-[#ddd8cc] bg-white hover:border-[#9a9080] hover:bg-[#faf8f3]"
                  }`}
                >
                  <span className="text-2xl mb-2 block">{icon}</span>
                  <p className="text-[#1e2d18] font-bold text-lg">{label}</p>
                  <p className="text-[#9a9080] text-sm mt-0.5">{sub}</p>
                </button>
              );
            })}
          </div>

          {/* Delivery info */}
          {deliveryMethod === "delivery" && (
            <div className="bg-[#e9f0e4] border border-[#3d6b2a]/15 rounded-xl p-4">
              <p className="text-[#1e2d18] text-sm font-semibold mb-1">Delivery every Sunday</p>
              <p className="text-[#7a7060] text-xs">Your meals will arrive between 4:00 PM – 8:00 PM. Exact time depends on route — we&apos;ll text you a 30-min heads up.</p>
            </div>
          )}

          {/* Pickup day/time selection */}
          {deliveryMethod === "pickup" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#7a7060] mb-2">Preferred pickup day</label>
                <div className="flex flex-wrap gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <button
                      key={day}
                      onClick={() => setPickupDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition min-h-[40px] ${
                        pickupDay === day
                          ? "bg-[#e9f0e4] border-[#3d6b2a] text-[#1e2d18]"
                          : "bg-white border-[#ddd8cc] text-[#7a7060] hover:border-[#9a9080]"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              {pickupDay && (
                <div>
                  <label className="block text-xs font-medium text-[#7a7060] mb-2">Preferred pickup time</label>
                  <div className="flex flex-wrap gap-2">
                    {["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"].map((time) => (
                      <button
                        key={time}
                        onClick={() => setPickupTime(time)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border transition min-h-[40px] ${
                          pickupTime === time
                            ? "bg-[#e9f0e4] border-[#3d6b2a] text-[#1e2d18]"
                            : "bg-white border-[#ddd8cc] text-[#7a7060] hover:border-[#9a9080]"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {deliveryMethod && (
            <div className="mt-4">
              <button
                onClick={() => {
                  const el = document.getElementById("step-5");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center gap-1.5 text-[#3d6b2a] text-sm font-semibold hover:gap-2.5 transition-all"
              >
                Choose billing <ChevronRight size={16} />
              </button>
            </div>
          )}
        </StepSection>
      )}

      {/* ── STEP 5: Billing Cycle ── */}
      {selectedSize && deliveryMethod && (
        <StepSection number={5} label="Choose your billing cycle" active={true} id="step-5">
          {selectedPlan && (
            <div className="space-y-3">
              {/* Weekly */}
              <BillingCard
                label="Weekly"
                badge="Most Flexible"
                badgeColor="bg-[#f2efe8] text-[#7a7060]"
                description="Pay week by week. Skip or cancel anytime."
                price={`$${calcPrice(selectedPlan, "weekly", selectedSize!).toFixed(0)}`}
                priceSub="/week"
                isSelected={billingInterval === "weekly"}
                onClick={() => setBillingInterval("weekly")}
              />

              {/* Monthly */}
              <BillingCard
                label="Monthly"
                badge="Save ~5%"
                badgeColor="bg-blue-50 text-blue-700"
                description="Billed once a month. Easier to budget."
                price={`$${calcPrice(selectedPlan, "monthly", selectedSize!).toFixed(0)}`}
                priceSub="/month"
                isSelected={billingInterval === "monthly"}
                onClick={() => setBillingInterval("monthly")}
              />

              {/* Annual — Hormozi Offer */}
              {(() => {
                const { annualPrice, totalValue, savings } = getAnnualValueBlock(selectedPlan, selectedSize!);
                const monthlyEquiv = (annualPrice / 12).toFixed(0);

                return (
                  <button
                    onClick={() => setBillingInterval("annual")}
                    className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                      billingInterval === "annual"
                        ? "border-[#3d6b2a] shadow-xl shadow-[#3d6b2a]/15"
                        : "border-[#3d6b2a]/30 hover:border-[#3d6b2a]/60"
                    }`}
                  >
                    {/* Gradient header */}
                    <div className="bg-[#e9f0e4] px-5 pt-4 pb-3 border-b border-[#3d6b2a]/15">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Crown size={16} className="text-[#3d6b2a]" />
                          <span className="text-[#1e2d18] font-black text-lg">Annual</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-[#3d6b2a] text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                            <Star size={9} fill="currentColor" /> BEST VALUE — LIMITED
                          </span>
                          {billingInterval === "annual" && (
                            <div className="w-5 h-5 bg-[#3d6b2a] rounded-full flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[#3d6b2a]/80 text-xs font-medium">Lock in founding member pricing — before we raise rates.</p>
                    </div>

                    <div className="bg-white px-5 py-4">
                      {/* Value Stack */}
                      <div className="mb-4">
                        <p className="text-[#9a9080] text-xs uppercase tracking-widest mb-2">What you get:</p>
                        <div className="space-y-2">
                          <ValueRow icon={<Utensils size={13} />} label={`${selectedPlan.meals_per_week} meals/week × 52 weeks`} value={`$${(calcPrice(selectedPlan, "weekly", selectedSize!) * 52).toFixed(0)}`} />
                          <ValueRow icon={<Shirt size={13} />} label="Mad Fresh T-Shirt" value="$45" />
                          <ValueRow icon={<Droplets size={13} />} label="Premium Water Bottle" value="$55" />
                          <ValueRow icon={<Gift size={13} />} label="3 Gift Cards — give a friend a free week" value="$237" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#ede9e2] flex items-center justify-between">
                          <span className="text-[#7a7060] text-sm font-semibold">Total Value</span>
                          <span className="text-[#7a7060] text-base line-through">${totalValue.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* The Offer */}
                      <div className="bg-[#e9f0e4] border border-[#3d6b2a]/15 rounded-xl p-4 mb-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[#7a7060] text-xs mb-0.5">You pay just</p>
                            <p className="text-[#3d6b2a] font-black text-4xl">${annualPrice.toFixed(0)}</p>
                            <p className="text-[#9a9080] text-xs mt-0.5">≈ ${monthlyEquiv}/mo · billed once</p>
                          </div>
                          <div className="text-right">
                            <div className="bg-[#e9f0e4] border border-[#3d6b2a]/15 rounded-lg px-3 py-1.5">
                              <p className="text-[#3d6b2a] font-black text-xl">${savings.toFixed(0)}</p>
                              <p className="text-[#3d6b2a]/70 text-[10px] font-semibold uppercase tracking-wide">Total Savings</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bonus Items */}
                      <div>
                        <p className="text-[#7a7060] text-xs font-semibold uppercase tracking-widest mb-2">Your founding member bonuses:</p>
                        <div className="grid grid-cols-3 gap-2">
                          <BonusChip icon={<Shirt size={14} className="text-[#3d6b2a]" />} label="Mad Fresh Tee" />
                          <BonusChip icon={<Droplets size={14} className="text-[#3d6b2a]" />} label="Water Bottle" />
                          <BonusChip icon={<Gift size={14} className="text-[#3d6b2a]" />} label="3 Gift Cards" />
                        </div>
                        <p className="text-[#9a9080] text-xs mt-3 flex items-center gap-1.5">
                          <Lock size={11} className="text-[#3d6b2a]" />
                          Gift cards let you give 3 friends a free week of meals — each.
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
          )}
        </StepSection>
      )}

      {/* ── Sticky Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#faf8f3] via-[#faf8f3]/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          {canProceed && selectedPlan && selectedSize && billingInterval ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white border border-[#ddd8cc] rounded-xl px-3 py-2.5 hidden sm:block">
                <p className="text-[#7a7060] text-[11px] leading-none mb-0.5">Your plan</p>
                <p className="text-[#1e2d18] text-sm font-semibold truncate">
                  {selectedPlan.meals_per_week} meals · {selectedSize} · {deliveryMethod} · {billingInterval}
                  {selectedProteins.length > 0 ? ` · ${selectedProteins.join(", ")}` : ""}
                </p>
              </div>
              <button
                onClick={() => { setCheckoutError(""); setShowCheckout(true); }}
                className="flex-1 sm:flex-none bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-black py-4 px-6 rounded-xl transition shadow-lg shadow-[#3d6b2a]/25 flex items-center justify-center gap-2 text-base"
              >
                <Crown size={18} />
                Subscribe · {(() => {
                  const price = calcPrice(selectedPlan, billingInterval, selectedSize);
                  if (billingInterval === "annual") return `$${price.toFixed(0)}/yr`;
                  if (billingInterval === "monthly") return `$${price.toFixed(0)}/mo`;
                  return `$${price.toFixed(0)}/wk`;
                })()}
              </button>
            </div>
          ) : (
            <button
              disabled
              className="w-full bg-[#f2efe8] border border-[#ddd8cc] text-[#9a9080] font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-default"
            >
              <Sparkles size={16} />
              {!selectedPlanId
                ? "Select your meals per week above"
                : !selectedSize
                ? "Choose a meal size"
                : !deliveryMethod
                ? "Choose delivery or pickup"
                : "Choose a billing cycle"}
            </button>
          )}
          <p className="text-center text-xs text-[#9a9080] mt-2">
            Secure checkout by Stripe · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function StepSection({
  number,
  label,
  children,
  active,
  optional,
  id,
}: {
  number: number;
  label: string;
  children: React.ReactNode;
  active?: boolean;
  optional?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={`mb-6 transition-opacity duration-300 ${active ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
          active ? "bg-[#3d6b2a] text-white" : "bg-[#f2efe8] text-[#9a9080]"
        }`}>
          {number}
        </div>
        <h2 className="text-[#1e2d18] font-bold text-lg sm:text-xl">{label}</h2>
        {optional && (
          <span className="text-[#9a9080] text-xs border border-[#ddd8cc] rounded-full px-2 py-0.5">optional</span>
        )}
      </div>
      {children}
    </div>
  );
}

function MacroRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#9a9080] text-xs">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function BillingCard({
  label,
  badge,
  badgeColor,
  description,
  price,
  priceSub,
  isSelected,
  onClick,
}: {
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  price: string;
  priceSub: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border-2 flex items-center gap-4 transition-all duration-200 ${
        isSelected
          ? "border-[#3d6b2a] bg-[#e9f0e4] shadow-lg shadow-[#3d6b2a]/10"
          : "border-[#ddd8cc] bg-white hover:border-[#9a9080] hover:bg-[#faf8f3]"
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        isSelected ? "border-[#3d6b2a] bg-[#3d6b2a]" : "border-[#9a9080]"
      }`}>
        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[#1e2d18] font-bold">{label}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
        </div>
        <p className="text-[#9a9080] text-xs">{description}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[#1e2d18] font-black text-xl">{price}</p>
        <p className="text-[#9a9080] text-xs">{priceSub}</p>
      </div>
    </button>
  );
}

function ValueRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#3d6b2a]/60 flex-shrink-0">{icon}</span>
      <span className="text-[#7a7060] text-xs flex-1">{label}</span>
      <span className="text-[#4a5e3a] text-xs font-semibold">{value}</span>
    </div>
  );
}

function BonusChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bg-[#e9f0e4] border border-[#3d6b2a]/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center">
      {icon}
      <span className="text-[#4a5e3a] text-[11px] font-medium leading-tight">{label}</span>
    </div>
  );
}
