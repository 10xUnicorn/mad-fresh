"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "free_delivery";
  discount_value: number | null;
  min_order_amount: number | null;
  max_discount: number | null;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

interface Props {
  initialCoupons: Coupon[];
}

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export default function CouponManager({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed" | "free_delivery",
    discount_value: 10,
    min_order_amount: 0,
    max_discount: null as number | null,
    max_uses: null as number | null,
    max_uses_per_user: 1,
    is_active: true,
    starts_at: new Date().toISOString().split("T")[0],
    expires_at: "",
  });

  const resetForm = () => {
    setForm({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_amount: 0,
      max_discount: null,
      max_uses: null,
      max_uses_per_user: 1,
      is_active: true,
      starts_at: new Date().toISOString().split("T")[0],
      expires_at: "",
    });
    setEditingId(null);
    setShowAdd(false);
    setError(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value || 0,
      min_order_amount: coupon.min_order_amount || 0,
      max_discount: coupon.max_discount,
      max_uses: coupon.max_uses,
      max_uses_per_user: coupon.max_uses_per_user,
      is_active: coupon.is_active,
      starts_at: coupon.starts_at.split("T")[0],
      expires_at: coupon.expires_at ? coupon.expires_at.split("T")[0] : "",
    });
    setEditingId(coupon.id);
    setShowAdd(true);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const payload = {
        store_id: STORE_ID,
        code: form.code.toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount || 0,
        max_discount: form.max_discount,
        max_uses: form.max_uses,
        max_uses_per_user: form.max_uses_per_user,
        is_active: form.is_active,
        starts_at: new Date(form.starts_at).toISOString(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };

      if (editingId) {
        const { data, error: updateError } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();

        if (updateError) {
          setError(updateError.message);
        } else if (data) {
          setCoupons((prev) =>
            prev.map((c) => (c.id === editingId ? (data as Coupon) : c))
          );
          resetForm();
        }
      } else {
        const { data, error: insertError } = await supabase
          .from("coupons")
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
        } else if (data) {
          setCoupons((prev) => [data as Coupon, ...prev]);
          resetForm();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("coupons").delete().eq("id", id);

      if (error) {
        setError(error.message);
      } else {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("coupons")
        .update({ is_active: !coupon.is_active })
        .eq("id", coupon.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? (data as Coupon) : c))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopying(code);
    setTimeout(() => setCopying(null), 2000);
  };

  // Calculate stats
  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => c.is_active).length,
    expired: coupons.filter((c) => c.expires_at && new Date(c.expires_at) < new Date()).length,
    totalRedemptions: coupons.reduce((sum, c) => sum + c.current_uses, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1e2d18]">Coupon Management</h1>
            <p className="text-[#7a7060] mt-1">Create and manage promotional codes</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-black px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus size={18} />
            New Coupon
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-lg p-4">
            <p className="text-[#7a7060] text-sm">Total Coupons</p>
            <p className="text-2xl font-bold text-[#1e2d18]">{stats.total}</p>
          </div>
          <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-lg p-4">
            <p className="text-[#7a7060] text-sm">Active</p>
            <p className="text-2xl font-bold text-[#3d6b2a]">{stats.active}</p>
          </div>
          <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-lg p-4">
            <p className="text-[#7a7060] text-sm">Expired</p>
            <p className="text-2xl font-bold text-[#4a5e3a]">{stats.expired}</p>
          </div>
          <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-lg p-4">
            <p className="text-[#7a7060] text-sm">Total Redeemed</p>
            <p className="text-2xl font-bold text-[#1e2d18]">{stats.totalRedemptions}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-500/20 rounded-lg p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAdd && (
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingId ? "Edit Coupon" : "Create New Coupon"}
            </h2>
            <button
              onClick={resetForm}
              className="text-[#7a7060] hover:text-[#9a9080]"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="LAUNCH20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
                disabled={!!editingId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_type: e.target.value as "percentage" | "fixed" | "free_delivery",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#75F663]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>

            {form.discount_type !== "free_delivery" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value *
                </label>
                <input
                  type="number"
                  value={form.discount_value || ""}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={form.discount_type === "percentage" ? "10" : "5.00"}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Order Amount ($)
              </label>
              <input
                type="number"
                value={form.min_order_amount || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    min_order_amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
              />
            </div>

            {form.discount_type === "percentage" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Discount Cap ($)
                </label>
                <input
                  type="number"
                  value={form.max_discount || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_discount: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="Leave empty for no cap"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses
              </label>
              <input
                type="number"
                value={form.max_uses || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_uses: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Leave empty for unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses Per User
              </label>
              <input
                type="number"
                value={form.max_uses_per_user}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_uses_per_user: parseInt(e.target.value) || 1,
                  })
                }
                placeholder="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starts At *
              </label>
              <input
                type="date"
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#75F663]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires At
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm({ ...form, expires_at: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="e.g., Launch week special offer"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#75F663]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#3d6b2a] hover:bg-[#2f5720] disabled:opacity-50 text-black px-4 py-2 rounded-lg font-medium transition"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Coupon"}
            </button>
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="space-y-3">
        {coupons.length === 0 ? (
          <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-lg p-8 text-center">
            <p className="text-[#7a7060]">No coupons yet. Create one to get started.</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono font-bold text-lg text-gray-900">
                    {coupon.code}
                  </p>
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="text-[#7a7060] hover:text-[#9a9080]"
                  >
                    <Copy size={16} />
                  </button>
                  {copying === coupon.code && (
                    <span className="text-xs text-green-600 font-medium">Copied!</span>
                  )}
                </div>
                {coupon.description && (
                  <p className="text-sm text-[#9a9080] mb-2">{coupon.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-[#9a9080]">
                  <span>
                    {coupon.discount_type === "free_delivery"
                      ? "Free Delivery"
                      : `${coupon.discount_value}${
                          coupon.discount_type === "percentage" ? "%" : "$"
                        }`}
                  </span>
                  <span>Used: {coupon.current_uses}/{coupon.max_uses || "∞"}</span>
                  <span>
                    {coupon.expires_at
                      ? `Expires: ${new Date(coupon.expires_at).toLocaleDateString()}`
                      : "No expiry"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(coupon)}
                  className={`p-2 rounded-lg transition ${
                    coupon.is_active
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-[#9a9080]"
                  }`}
                >
                  {coupon.is_active ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(coupon)}
                  className="p-2 rounded-lg bg-gray-100 text-[#9a9080] hover:bg-gray-200 transition"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
