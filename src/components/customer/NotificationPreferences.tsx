"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";

const CATEGORIES = [
  { key: "order_confirmation", label: "Order Confirmations", desc: "Receipts when you place an order" },
  { key: "order_status", label: "Order Updates", desc: "Status changes and delivery updates" },
  { key: "subscription", label: "Subscriptions", desc: "Renewal reminders and plan changes" },
  { key: "rewards", label: "Rewards & Loyalty", desc: "Points earned, tier updates, rewards" },
  { key: "marketing", label: "Promotions & Offers", desc: "Deals, new items, and seasonal specials" },
] as const;

const ALWAYS_ON = [
  { key: "account", label: "Account & Security" },
  { key: "system", label: "System Alerts" },
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notification-preferences");
        if (!res.ok) throw new Error("Failed to load preferences");
        const data = await res.json();
        setPreferences(data.preferences);
      } catch {
        setError("Could not load notification preferences");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const toggle = async (category: string) => {
    const newValue = !preferences[category];
    const prev = { ...preferences };
    setPreferences((p) => ({ ...p, [category]: newValue }));
    setSaving(category);
    setError(null);

    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { [category]: newValue } }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      setPreferences(prev);
      setError("Failed to save preference");
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#f2efe8] flex items-center justify-center">
            <Bell size={18} className="text-[#7a7060]" />
          </div>
          <h2 className="text-sm font-semibold text-[#1e2d18]">Notification Preferences</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#f2efe8] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ddd8cc] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-[#f2efe8] flex items-center justify-center">
          <Bell size={18} className="text-[#3d6b2a]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1e2d18]">Notification Preferences</h2>
          <p className="text-xs text-[#9a9080]">Choose which emails you receive</p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-2 px-1">{error}</p>
      )}

      <div className="mt-4 space-y-1 divide-y divide-[#ede9e2]">
        {CATEGORIES.map((cat) => {
          const enabled = preferences[cat.key] !== false;
          const isSaving = saving === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => toggle(cat.key)}
              disabled={isSaving}
              className="w-full flex items-center justify-between py-3 px-1 hover:bg-[#f0ece3] transition rounded-lg group"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-[#1e2d18]">{cat.label}</p>
                <p className="text-xs text-[#9a9080]">{cat.desc}</p>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  enabled ? "bg-[#3d6b2a]" : "bg-[#f2efe8]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Always-on categories */}
      <div className="mt-4 pt-3 border-t border-[#ddd8cc]">
        <p className="text-[11px] text-[#9a9080] uppercase tracking-wider mb-2 px-1">Always enabled</p>
        {ALWAYS_ON.map((cat) => (
          <div key={cat.key} className="flex items-center justify-between py-2 px-1">
            <p className="text-sm text-[#7a7060]">{cat.label}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#9a9080]">
              <Check size={12} />
              Required
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
