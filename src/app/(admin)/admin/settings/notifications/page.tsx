"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bell, Plus, Trash2, Mail, ToggleLeft, ToggleRight,
  Loader2, AlertCircle, X, ChevronLeft,
} from "lucide-react";
import Link from "next/link";

// ─── Category config ────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  { key: "order_confirmation", label: "Order Confirmations" },
  { key: "order_status", label: "Order Updates" },
  { key: "subscription", label: "Subscriptions" },
  { key: "rewards", label: "Rewards & Loyalty" },
  { key: "marketing", label: "Marketing Campaigns" },
  { key: "catering", label: "Catering" },
  { key: "account", label: "Account & Security" },
  { key: "system", label: "System Alerts" },
] as const;

type CategoryKey = (typeof ALL_CATEGORIES)[number]["key"];

interface BccSetting {
  id: string;
  store_id: string;
  bcc_email: string;
  label: string;
  categories: CategoryKey[];
  is_active: boolean;
  created_at: string;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<BccSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // New recipient form
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/notification-settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      setSettings(data.settings || []);
    } catch {
      setError("Failed to load notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  const addRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newEmail.trim() || !newLabel.trim()) {
      setFormError("Email and label are required");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bcc_email: newEmail.trim(), label: newLabel.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add");
      }
      const data = await res.json();
      setSettings((prev) => [...prev, data.setting]);
      setNewEmail("");
      setNewLabel("");
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to add recipient");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleActive = async (setting: BccSetting) => {
    const newActive = !setting.is_active;
    // Optimistic update
    setSettings((prev) =>
      prev.map((s) => (s.id === setting.id ? { ...s, is_active: newActive } : s))
    );
    setSaving(setting.id);
    try {
      const res = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: setting.id, is_active: newActive }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      // Revert
      setSettings((prev) =>
        prev.map((s) => (s.id === setting.id ? { ...s, is_active: !newActive } : s))
      );
    } finally {
      setSaving(null);
    }
  };

  const toggleCategory = async (setting: BccSetting, categoryKey: CategoryKey) => {
    const hasCategory = setting.categories.includes(categoryKey);
    const newCategories = hasCategory
      ? setting.categories.filter((c) => c !== categoryKey)
      : [...setting.categories, categoryKey];

    // Optimistic update
    setSettings((prev) =>
      prev.map((s) => (s.id === setting.id ? { ...s, categories: newCategories } : s))
    );
    setSaving(`${setting.id}-${categoryKey}`);
    try {
      const res = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: setting.id, categories: newCategories }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      // Revert
      setSettings((prev) =>
        prev.map((s) =>
          s.id === setting.id ? { ...s, categories: setting.categories } : s
        )
      );
    } finally {
      setSaving(null);
    }
  };

  const deleteRecipient = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/notification-settings?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setSettings((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Failed to delete recipient");
    } finally {
      setSaving(null);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#3d6b2a]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1.5 text-sm text-[#7a7060] hover:text-[#1e2d18] transition mb-4"
        >
          <ChevronLeft size={16} /> Back to Settings
        </Link>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2 flex items-center gap-3">
          <Bell size={32} className="text-[#3d6b2a]" />
          Notification Settings
        </h1>
        <p className="text-[#7a7060]">
          Manage BCC recipients for outgoing emails. Each recipient can be subscribed to specific email categories.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* BCC Recipients */}
      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className={`bg-white border rounded-2xl p-6 transition-all ${
              setting.is_active
                ? "border-[#ddd8cc]"
                : "border-[#ddd8cc] opacity-60"
            }`}
          >
            {/* Recipient header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#e9f0e4] flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-[#3d6b2a]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[#1e2d18] font-semibold truncate">{setting.label}</h3>
                  <p className="text-sm text-[#9a9080] truncate">{setting.bcc_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(setting)}
                  className="flex items-center gap-1.5 text-sm transition hover:opacity-80"
                  title={setting.is_active ? "Deactivate" : "Activate"}
                >
                  {setting.is_active ? (
                    <ToggleRight size={28} className="text-[#3d6b2a]" />
                  ) : (
                    <ToggleLeft size={28} className="text-[#9a9080]" />
                  )}
                </button>

                {/* Delete */}
                {deleteId === setting.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteRecipient(setting.id)}
                      className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteId(null)}
                      className="px-2.5 py-1 text-xs text-[#7a7060] hover:text-[#1e2d18] transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteId(setting.id)}
                    className="p-1.5 text-[#9a9080] hover:text-red-600 transition rounded-lg hover:bg-red-50"
                    title="Remove recipient"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const active = setting.categories.includes(cat.key);
                const isSaving = saving === `${setting.id}-${cat.key}`;
                return (
                  <button
                    key={cat.key}
                    onClick={() => toggleCategory(setting, cat.key)}
                    disabled={!setting.is_active || isSaving}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? "bg-[#e9f0e4] text-[#3d6b2a] border-[#3d6b2a]/30 hover:bg-[#dde8d6]"
                        : "bg-[#f2efe8] text-[#9a9080] border-[#ddd8cc] hover:border-[#ddd8cc] hover:text-[#7a7060]"
                    } ${!setting.is_active ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isSaving ? (
                      <Loader2 size={12} className="animate-spin inline mr-1" />
                    ) : null}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {settings.length === 0 && !showForm && (
          <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f2efe8] flex items-center justify-center mx-auto mb-3">
              <Mail size={24} className="text-[#9a9080]" />
            </div>
            <h3 className="text-[#1e2d18] font-semibold mb-1">No BCC recipients</h3>
            <p className="text-sm text-[#9a9080] mb-4">
              Add email addresses to receive copies of outgoing notifications.
            </p>
          </div>
        )}
      </div>

      {/* Add new recipient form */}
      {showForm ? (
        <form onSubmit={addRecipient} className="bg-white border border-[#3d6b2a]/20 rounded-2xl p-6">
          <h3 className="text-[#1e2d18] font-semibold mb-4 flex items-center gap-2">
            <Plus size={18} className="text-[#3d6b2a]" />
            Add BCC Recipient
          </h3>

          {formError && (
            <p className="text-xs text-red-600 mb-3">{formError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[#7a7060] mb-1.5">Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Owner, Manager"
                className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-sm text-[#1e2d18] placeholder-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-[#7a7060] mb-1.5">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="owner@madfresh.app"
                className="w-full bg-white border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-sm text-[#1e2d18] placeholder-[#9a9080] focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#3d6b2a] text-white hover:bg-[#2f5720] transition disabled:opacity-50"
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Recipient
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              className="px-4 py-2.5 text-sm text-[#7a7060] hover:text-[#1e2d18] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border border-dashed border-[#ddd8cc] text-[#7a7060] hover:text-[#3d6b2a] hover:border-[#3d6b2a]/30 transition w-full justify-center"
        >
          <Plus size={16} />
          Add BCC Recipient
        </button>
      )}

      {/* Info box */}
      <div className="bg-[#e9f0e4] border border-[#3d6b2a]/10 rounded-xl p-4">
        <p className="text-xs text-[#7a7060] leading-relaxed">
          <span className="text-[#3d6b2a] font-semibold">How BCC works:</span> When the system sends a notification email
          (order confirmations, status updates, etc.), active BCC recipients will receive a copy based on their subscribed
          categories. Customers can also manage their own notification preferences from their account page.
        </p>
      </div>
    </div>
  );
}
