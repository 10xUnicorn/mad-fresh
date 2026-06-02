"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Save, Eye, EyeOff, AlertCircle, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

interface PaymentSettingsData {
  id: string;
  store_id: string;
  stripe_publishable_key: string | null;
  stripe_secret_key_encrypted: string | null;
  stripe_webhook_secret_encrypted: string | null;
  stripe_account_id: string | null;
  currency: string;
  tax_rate: number;
  delivery_fee: number;
  free_delivery_minimum: number | null;
  tip_enabled: boolean;
  tip_presets: number[];
  auto_capture: boolean;
  statement_descriptor: string | null;
  is_live_mode: boolean;
  is_active: boolean;
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Editable fields
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [accountId, setAccountId] = useState("");
  const [taxRate, setTaxRate] = useState("8.60");
  const [deliveryFee, setDeliveryFee] = useState("5.99");
  const [freeDeliveryMin, setFreeDeliveryMin] = useState("40.00");
  const [statementDescriptor, setStatementDescriptor] = useState("MAD FRESH KITCHEN");
  const [autoCapture, setAutoCapture] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [tipEnabled, setTipEnabled] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .eq("provider", "stripe")
      .single();

    if (data) {
      setSettings(data);
      setPublishableKey(data.stripe_publishable_key || "");
      setSecretKey(data.stripe_secret_key_encrypted || "");
      setWebhookSecret(data.stripe_webhook_secret_encrypted || "");
      setAccountId(data.stripe_account_id || "");
      setTaxRate(((data.tax_rate || 0.086) * 100).toFixed(2));
      setDeliveryFee((data.delivery_fee || 5.99).toFixed(2));
      setFreeDeliveryMin((data.free_delivery_minimum || 40).toFixed(2));
      setStatementDescriptor(data.statement_descriptor || "MAD FRESH KITCHEN");
      setAutoCapture(data.auto_capture ?? true);
      setIsLiveMode(data.is_live_mode ?? false);
      setTipEnabled(data.tip_enabled ?? true);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const updateData = {
      stripe_publishable_key: publishableKey || null,
      stripe_secret_key_encrypted: secretKey || null,
      stripe_webhook_secret_encrypted: webhookSecret || null,
      stripe_account_id: accountId || null,
      tax_rate: parseFloat(taxRate) / 100,
      delivery_fee: parseFloat(deliveryFee),
      free_delivery_minimum: parseFloat(freeDeliveryMin) || null,
      statement_descriptor: statementDescriptor,
      auto_capture: autoCapture,
      is_live_mode: isLiveMode,
      tip_enabled: tipEnabled,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("payment_settings")
      .update(updateData)
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .eq("provider", "stripe");

    if (error) {
      setSaveMessage("Failed to save: " + error.message);
    } else {
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw size={24} className="text-[#3d6b2a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] flex items-center gap-3">
            <CreditCard size={32} className="text-[#3d6b2a]" />
            Payment Settings
          </h1>
          <p className="text-[#7a7060] mt-1">Configure Stripe payments for your store</p>
        </div>
        <Link href="/admin/settings" className="text-sm text-[#3d6b2a] hover:underline">
          ← Back to Settings
        </Link>
      </div>

      {/* Live/Test Mode Banner */}
      <div className={`rounded-xl p-4 border ${isLiveMode ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isLiveMode ? "bg-green-500" : "bg-yellow-500"} animate-pulse`} />
            <div>
              <p className={`font-semibold ${isLiveMode ? "text-green-800" : "text-yellow-800"}`}>
                {isLiveMode ? "Live Mode" : "Test Mode"}
              </p>
              <p className={`text-xs ${isLiveMode ? "text-green-600" : "text-yellow-600"}`}>
                {isLiveMode ? "Processing real payments" : "Using test keys — no real charges"}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-[#9a9080]">Live</span>
            <div className="relative">
              <input type="checkbox" checked={isLiveMode} onChange={(e) => setIsLiveMode(e.target.checked)} className="sr-only" />
              <div className={`w-10 h-6 rounded-full transition ${isLiveMode ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isLiveMode ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Stripe API Keys */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Stripe API Keys</h3>
        <p className="text-sm text-[#9a9080] mb-6">
          Get your keys from{" "}
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-[#3d6b2a] hover:underline inline-flex items-center gap-1">
            Stripe Dashboard <ExternalLink size={12} />
          </a>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
            <input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_live_... or pk_test_..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_... or sk_test_..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
              />
              <button onClick={() => setShowSecretKey(!showSecretKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7060] hover:text-[#9a9080]">
                {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
            <div className="relative">
              <input
                type={showWebhookSecret ? "text" : "password"}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
              />
              <button onClick={() => setShowWebhookSecret(!showWebhookSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7060] hover:text-[#9a9080]">
                {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Account ID (optional)</label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="acct_..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
            />
            <p className="text-xs text-[#7a7060] mt-1">Used for switching between Stripe accounts</p>
          </div>
        </div>
      </div>

      {/* Payment Configuration */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Minimum ($)</label>
            <input
              type="number"
              step="0.01"
              value={freeDeliveryMin}
              onChange={(e) => setFreeDeliveryMin(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statement Descriptor</label>
            <input
              type="text"
              value={statementDescriptor}
              onChange={(e) => setStatementDescriptor(e.target.value.toUpperCase().slice(0, 22))}
              maxLength={22}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
            />
            <p className="text-xs text-[#7a7060] mt-1">Appears on customer bank statements (max 22 chars)</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={autoCapture} onChange={(e) => setAutoCapture(e.target.checked)} className="sr-only" />
              <div className={`w-10 h-6 rounded-full transition ${autoCapture ? "bg-[#3d6b2a]" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${autoCapture ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Auto-capture payments</p>
              <p className="text-xs text-[#7a7060]">Automatically capture funds when payment succeeds</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={tipEnabled} onChange={(e) => setTipEnabled(e.target.checked)} className="sr-only" />
              <div className={`w-10 h-6 rounded-full transition ${tipEnabled ? "bg-[#3d6b2a]" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${tipEnabled ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Enable tips</p>
              <p className="text-xs text-[#7a7060]">Allow customers to add tips at checkout</p>
            </div>
          </label>
        </div>
      </div>

      {/* Webhook URL Info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>
        <p className="text-sm text-[#9a9080] mb-4">Add this URL to your Stripe Dashboard under Developers → Webhooks:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm text-gray-700 break-all">
          {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/stripe` : "https://mad-fresh.vercel.app/api/webhooks/stripe"}
        </div>
        <p className="text-xs text-[#7a7060] mt-3">
          Events to listen for: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded,
          customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.paid
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white font-semibold rounded-xl transition disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? "Saving..." : "Save Payment Settings"}
        </button>

        {saveMessage && (
          <div className={`flex items-center gap-2 text-sm ${saveMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
            {saveMessage.includes("Failed") ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}
