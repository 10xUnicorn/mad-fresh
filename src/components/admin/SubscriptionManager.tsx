"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────
interface MacroRange {
  calories: number[];
  protein: number[];
  carbs: number[];
  fat: number[];
}

interface SubscriptionPlan {
  id: string;
  store_id: string;
  name: string;
  description: string;
  meals_per_week: number;
  price_weekly: number;
  price_monthly: number;
  price_annual: number;
  features?: string[];
  dietary_focus?: string;
  is_active: boolean;
  is_founding_member_price?: boolean;
  founding_member_price_weekly?: number;
  sort_order?: number;
  // Macro / size fields
  macros_small?: MacroRange | null;
  macros_medium?: MacroRange | null;
  macros_large?: MacroRange | null;
  price_small_modifier?: number | null;
  price_large_modifier?: number | null;
  annual_bonus_merch?: Record<string, unknown> | null;
  annual_bonus_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Subscription {
  id: string;
  store_id: string;
  customer_id: string;
  plan_id: string;
  status: "active" | "paused" | "cancelled";
  billing_interval: string;
  current_price: number;
  start_date: string;
  next_billing_date: string;
  is_founding_member: boolean;
  meal_size?: string;
  protein_preferences?: string[];
  created_at?: string;
  updated_at?: string;
}

interface SubscriptionManagerProps {
  initialPlans: SubscriptionPlan[];
  initialSubscribers: Subscription[];
}

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

const DEFAULT_MACROS: MacroRange = { calories: [0, 0], protein: [0, 0], carbs: [0, 0], fat: [0, 0] };

// ─── Component ───────────────────────────────────────────
export default function SubscriptionManager({
  initialPlans = [],
  initialSubscribers = [],
}: SubscriptionManagerProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"plans" | "subscribers">("plans");
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [subscribers, setSubscribers] = useState<Subscription[]>(initialSubscribers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: "",
    description: "",
    meals_per_week: 4,
    price_weekly: 0,
    price_monthly: 0,
    price_annual: 0,
    features: [],
    dietary_focus: "",
    is_active: true,
    macros_small: { calories: [350, 450], protein: [25, 35], carbs: [30, 45], fat: [12, 20] },
    macros_medium: { calories: [500, 650], protein: [35, 50], carbs: [45, 65], fat: [18, 28] },
    macros_large: { calories: [700, 900], protein: [50, 70], carbs: [65, 90], fat: [25, 40] },
    price_small_modifier: 0.85,
    price_large_modifier: 1.20,
    annual_bonus_description: "Annual members get: Mad Fresh t-shirt, water bottle, and 3 gift cards to give friends a free week!",
  });
  const [featuresInput, setFeaturesInput] = useState("");

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const showNotification = useCallback((message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  // ─── Macro helpers ─────────────────────────────────────
  function getMacro(size: "small" | "medium" | "large"): MacroRange {
    const key = `macros_${size}` as keyof typeof formData;
    return (formData[key] as MacroRange) || { ...DEFAULT_MACROS };
  }

  function setMacro(size: "small" | "medium" | "large", field: keyof MacroRange, idx: 0 | 1, val: number) {
    const key = `macros_${size}` as keyof typeof formData;
    const current = getMacro(size);
    const arr = [...current[field]];
    arr[idx] = val;
    setFormData({ ...formData, [key]: { ...current, [field]: arr } });
  }

  // ─── CRUD ─────────────────────────────────────────────
  const handleCreatePlan = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      meals_per_week: 4,
      price_weekly: 0,
      price_monthly: 0,
      price_annual: 0,
      features: [],
      dietary_focus: "",
      is_active: true,
      macros_small: { calories: [350, 450], protein: [25, 35], carbs: [30, 45], fat: [12, 20] },
      macros_medium: { calories: [500, 650], protein: [35, 50], carbs: [45, 65], fat: [18, 28] },
      macros_large: { calories: [700, 900], protein: [50, 70], carbs: [65, 90], fat: [25, 40] },
      price_small_modifier: 0.85,
      price_large_modifier: 1.20,
      annual_bonus_description: "Annual members get: Mad Fresh t-shirt, water bottle, and 3 gift cards to give friends a free week!",
    });
    setFeaturesInput("");
    setShowAdvanced(false);
    setShowModal(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData(plan);
    setFeaturesInput(plan.features?.join("\n") || "");
    setShowAdvanced(false);
    setShowModal(true);
  };

  const handleSavePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const features = featuresInput
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const planData = {
        name: formData.name,
        description: formData.description,
        meals_per_week: formData.meals_per_week,
        price_weekly: formData.price_weekly,
        price_monthly: formData.price_monthly,
        price_annual: formData.price_annual || 0,
        features,
        dietary_focus: formData.dietary_focus,
        is_active: formData.is_active,
        sort_order: formData.sort_order ?? 0,
        store_id: STORE_ID,
        macros_small: formData.macros_small,
        macros_medium: formData.macros_medium,
        macros_large: formData.macros_large,
        price_small_modifier: formData.price_small_modifier ?? 0.85,
        price_large_modifier: formData.price_large_modifier ?? 1.20,
        annual_bonus_description: formData.annual_bonus_description,
      };

      if (editingPlan?.id) {
        const { error: updateError } = await supabase
          .from("subscription_plans")
          .update(planData)
          .eq("id", editingPlan.id);
        if (updateError) throw updateError;
        setPlans(plans.map((p) => (p.id === editingPlan.id ? { ...p, ...planData } as SubscriptionPlan : p)));
        showNotification("Plan updated", "success");
      } else {
        const { data, error: insertError } = await supabase
          .from("subscription_plans")
          .insert([planData])
          .select()
          .single();
        if (insertError) throw insertError;
        if (data) {
          setPlans([...plans, data]);
          showNotification("Plan created", "success");
        }
      }
      setShowModal(false);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Failed to save plan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Delete this plan? This cannot be undone.")) return;
    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from("subscription_plans").delete().eq("id", planId);
      if (deleteError) throw deleteError;
      setPlans(plans.filter((p) => p.id !== planId));
      showNotification("Plan deleted", "success");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscriptionStatus = async (subscriptionId: string, newStatus: "active" | "paused" | "cancelled") => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase.from("subscriptions").update({ status: newStatus }).eq("id", subscriptionId);
      if (updateError) throw updateError;
      setSubscribers(subscribers.map((s) => (s.id === subscriptionId ? { ...s, status: newStatus } : s)));
      showNotification(`Subscription ${newStatus}`, "success");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (planId: string) => plans.find((p) => p.id === planId)?.name || "Unknown";

  function formatRange(arr?: number[]): string {
    if (!arr || arr.length < 2) return "—";
    return `${arr[0]}–${arr[1]}`;
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#ddd8cc]">
        {(["plans", "subscribers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 font-medium text-sm transition-colors capitalize ${
              activeTab === tab
                ? "text-[#3d6b2a] border-b-2 border-[#3d6b2a]"
                : "text-[#7a7060] hover:text-[#4a5e3a]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ Plans Tab ═══ */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#1e2d18]">Subscription Plans</h2>
            <button
              onClick={handleCreatePlan}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#449531] text-white rounded-xl hover:bg-[#449531]/90 disabled:opacity-50 transition text-sm font-semibold"
            >
              <Plus size={18} /> New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <div key={plan.id} className="bg-white border border-[#ddd8cc] rounded-2xl p-5 hover:border-[#3d6b2a]/30 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[#1e2d18] font-bold text-lg">{plan.name}</h3>
                      <p className="text-[#9a9080] text-sm mt-0.5">{plan.description}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      plan.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-[#9a9080]"
                    }`}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Meals/week</span>
                      <span className="text-[#1e2d18] font-semibold">{plan.meals_per_week}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Per meal</span>
                      <span className="text-[#3d6b2a] font-bold">
                        {plan.meals_per_week > 0
                          ? fmt(plan.price_weekly / plan.meals_per_week)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Weekly</span>
                      <span className="text-[#1e2d18] font-semibold">{fmt(plan.price_weekly)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Monthly</span>
                      <span className="text-[#1e2d18] font-semibold">{fmt(plan.price_monthly)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Annual</span>
                      <span className="text-[#3d6b2a] font-semibold">{fmt(plan.price_annual)}</span>
                    </div>
                  </div>

                  {/* Macros preview */}
                  {plan.macros_medium && (
                    <div className="bg-[#f2efe8] rounded-lg p-3 mb-4">
                      <p className="text-[10px] text-[#9a9080] uppercase tracking-wider mb-2 font-semibold">Medium Macros</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-orange-600">Cal: {formatRange(plan.macros_medium.calories)}</span>
                        <span className="text-blue-600">Pro: {formatRange(plan.macros_medium.protein)}g</span>
                        <span className="text-yellow-600">Carb: {formatRange(plan.macros_medium.carbs)}g</span>
                        <span className="text-pink-600">Fat: {formatRange(plan.macros_medium.fat)}g</span>
                      </div>
                    </div>
                  )}

                  {/* Size modifiers */}
                  <div className="flex gap-2 text-[11px] text-[#9a9080] mb-4">
                    <span>S: {((plan.price_small_modifier ?? 0.85) * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>M: 100%</span>
                    <span>·</span>
                    <span>L: {((plan.price_large_modifier ?? 1.2) * 100).toFixed(0)}%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#ddd8cc] text-[#4a5e3a] rounded-lg hover:bg-[#f0ece3] disabled:opacity-50 transition text-sm"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={loading}
                      className="inline-flex items-center justify-center px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition text-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white border border-[#ddd8cc] rounded-xl">
                <p className="text-[#9a9080]">No subscription plans yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Subscribers Tab ═══ */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1e2d18]">Active Subscriptions</h2>
          <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
            {subscribers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#ddd8cc]">
                    <tr>
                      {["User", "Plan", "Size", "Interval", "Status", "Start", "Next Billing", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[#9a9080] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-[#ede9e2] hover:bg-[#f0ece3] transition">
                        <td className="px-4 py-3 text-sm text-[#4a5e3a] font-mono">{sub.customer_id.substring(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm text-[#1e2d18]">{getPlanName(sub.plan_id)}</td>
                        <td className="px-4 py-3 text-sm text-[#4a5e3a] capitalize">{sub.meal_size || "medium"}</td>
                        <td className="px-4 py-3 text-sm text-[#4a5e3a] capitalize">{sub.billing_interval}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sub.status === "active" ? "bg-green-50 text-green-700" :
                            sub.status === "paused" ? "bg-yellow-50 text-yellow-700" :
                            "bg-red-50 text-red-600"
                          }`}>
                            {sub.status === "active" ? <CheckCircle size={12} /> :
                             sub.status === "paused" ? <PauseCircle size={12} /> :
                             <AlertCircle size={12} />}
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#9a9080]">{formatDate(sub.start_date)}</td>
                        <td className="px-4 py-3 text-sm text-[#9a9080]">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-[#9a9080]" />
                            {sub.next_billing_date ? formatDate(sub.next_billing_date) : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-1.5">
                            {sub.status !== "active" && (
                              <button onClick={() => handleUpdateSubscriptionStatus(sub.id, "active")} disabled={loading}
                                className="px-2 py-1 text-[11px] font-semibold text-green-700 bg-green-50 rounded hover:bg-green-100 transition">Activate</button>
                            )}
                            {sub.status !== "paused" && (
                              <button onClick={() => handleUpdateSubscriptionStatus(sub.id, "paused")} disabled={loading}
                                className="px-2 py-1 text-[11px] font-semibold text-yellow-700 bg-yellow-50 rounded hover:bg-yellow-100 transition">Pause</button>
                            )}
                            {sub.status !== "cancelled" && (
                              <button onClick={() => handleUpdateSubscriptionStatus(sub.id, "cancelled")} disabled={loading}
                                className="px-2 py-1 text-[11px] font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100 transition">Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-[#9a9080]">No subscriptions yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Create/Edit Plan Modal ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#ddd8cc] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#ddd8cc]">
              <h2 className="text-xl font-bold text-[#1e2d18]">
                {editingPlan ? "Edit Plan" : "Create New Plan"}
              </h2>
              <button onClick={() => setShowModal(false)} disabled={loading}
                className="p-1.5 hover:bg-[#f0ece3] rounded-lg transition text-[#7a7060] hover:text-[#1e2d18]">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">

              {/* ━━━ CARD: Plan Info ━━━ */}
              <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#3d6b2a] uppercase tracking-widest">Plan Info</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[#7a7060] mb-1">Plan Name</label>
                    <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      placeholder="e.g., 10-Meal Plan" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-[#f2efe8] border border-[#ddd8cc] rounded-xl cursor-pointer hover:bg-[#f0ece3] transition">
                      <input type="checkbox" checked={formData.is_active || false}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#449531] focus:ring-[#449531]" />
                      <span className="text-sm text-[#4a5e3a] font-medium">Active</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#7a7060] mb-1">Description</label>
                  <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    placeholder="Plan description" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#7a7060] mb-1">Meals per Week</label>
                    <input type="number" value={formData.meals_per_week || 0}
                      onChange={(e) => setFormData({ ...formData, meals_per_week: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#7a7060] mb-1">Sort Order</label>
                    <input type="number" value={formData.sort_order ?? 0}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20" />
                  </div>
                </div>
              </div>

              {/* ━━━ CARD: Pricing ━━━ */}
              <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#3d6b2a] uppercase tracking-widest">Pricing</h3>

                {/* Per-Meal Price — auto-calculates weekly/monthly/annual */}
                <div>
                  <label className="block text-xs text-[#7a7060] mb-1 font-medium">Price per Meal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080] text-sm">$</span>
                    <input type="number" step="0.01"
                      value={
                        formData.meals_per_week && formData.price_weekly
                          ? (Number(formData.price_weekly) / Number(formData.meals_per_week)).toFixed(2)
                          : ""
                      }
                      onChange={(e) => {
                        const perMeal = parseFloat(e.target.value) || 0;
                        const mealsPerWeek = Number(formData.meals_per_week) || 1;
                        const weekly = Math.round(perMeal * mealsPerWeek * 100) / 100;
                        const monthly = Math.round(weekly * 4.33 * 100) / 100;
                        const annual = Math.round(weekly * 52 * 100) / 100;
                        setFormData({
                          ...formData,
                          price_weekly: weekly,
                          price_monthly: monthly,
                          price_annual: annual,
                        });
                      }}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-lg text-[#1e2d18] text-sm focus:border-[#3d6b2a] focus:outline-none font-semibold" />
                  </div>
                  <p className="text-[11px] text-[#9a9080] mt-1">Auto-fills weekly, monthly &amp; annual below. You can still override each.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "price_weekly", label: "Weekly" },
                    { key: "price_monthly", label: "Monthly" },
                    { key: "price_annual", label: "Annual" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-[#9a9080] mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080] text-sm">$</span>
                        <input type="number" step="0.01"
                          value={(formData as Record<string, unknown>)[key] as number || 0}
                          onChange={(e) => setFormData({ ...formData, [key]: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:border-[#3d6b2a] focus:outline-none" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Size Modifiers inline */}
                <div>
                  <label className="block text-xs text-[#9a9080] mb-2">Size Multipliers</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#9a9080] mb-1">Small</label>
                      <input type="number" step="0.01" value={formData.price_small_modifier ?? 0.85}
                        onChange={(e) => setFormData({ ...formData, price_small_modifier: parseFloat(e.target.value) || 0.85 })}
                        className="w-full px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:border-[#3d6b2a] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#9a9080] mb-1">Medium</label>
                      <input type="number" value={1.0} disabled
                        className="w-full px-3 py-2 bg-gray-50 border border-[#ddd8cc] rounded-lg text-[#9a9080] text-sm cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#9a9080] mb-1">Large</label>
                      <input type="number" step="0.01" value={formData.price_large_modifier ?? 1.2}
                        onChange={(e) => setFormData({ ...formData, price_large_modifier: parseFloat(e.target.value) || 1.2 })}
                        className="w-full px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:border-[#3d6b2a] focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ━━━ CARD: Macros ━━━ */}
              <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#3d6b2a] uppercase tracking-widest">Macro Ranges by Size</h3>
                {(["small", "medium", "large"] as const).map((size) => {
                  const m = getMacro(size);
                  return (
                    <div key={size} className="bg-white rounded-lg p-3 border border-[#ddd8cc]">
                      <p className="text-xs font-bold text-[#1e2d18] uppercase tracking-wider mb-2">{size}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                          <div key={field}>
                            <label className="block text-[10px] text-[#9a9080] mb-1 capitalize">{field}</label>
                            <div className="flex gap-1 items-center">
                              <input type="number" value={m[field]?.[0] ?? 0}
                                onChange={(e) => setMacro(size, field, 0, parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-white border border-[#ddd8cc] rounded text-[#1e2d18] text-xs focus:border-[#3d6b2a] focus:outline-none" />
                              <span className="text-[#9a9080] text-xs">–</span>
                              <input type="number" value={m[field]?.[1] ?? 0}
                                onChange={(e) => setMacro(size, field, 1, parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-white border border-[#ddd8cc] rounded text-[#1e2d18] text-xs focus:border-[#3d6b2a] focus:outline-none" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ━━━ CARD: Advanced ━━━ */}
              <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full px-5 py-3 text-sm text-[#7a7060] hover:text-[#4a5e3a] transition"
                >
                  <span className="font-bold uppercase tracking-widest text-xs">Advanced Settings</span>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvanced && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[#ede9e2] pt-4">
                    <div>
                      <label className="block text-xs font-medium text-[#7a7060] mb-1">Features (one per line)</label>
                      <textarea value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none text-sm"
                        placeholder={"Fresh ingredients\nCustomizable meals\nFree delivery"} rows={3} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7a7060] mb-1">Dietary Focus</label>
                      <input type="text" value={formData.dietary_focus || ""}
                        onChange={(e) => setFormData({ ...formData, dietary_focus: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none text-sm"
                        placeholder="e.g., Vegan, Keto, Mediterranean" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#7a7060] mb-1">Annual Bonus Description</label>
                      <textarea value={formData.annual_bonus_description || ""}
                        onChange={(e) => setFormData({ ...formData, annual_bonus_description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none text-sm"
                        placeholder="What annual members get..." rows={2} />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-[#ddd8cc]">
              <button onClick={() => setShowModal(false)} disabled={loading}
                className="flex-1 px-4 py-2.5 border border-[#ddd8cc] text-[#7a7060] rounded-xl hover:bg-[#f0ece3] disabled:opacity-50 transition text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSavePlan} disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#449531] text-white rounded-xl hover:bg-[#449531]/90 disabled:opacity-50 transition text-sm font-semibold">
                <Save size={16} />
                {loading ? "Saving..." : "Save Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
