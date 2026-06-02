"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Percent, Plus, Pencil, Trash2, Save, X } from "lucide-react";

interface DiscountTier {
  id: string;
  store_id: string;
  min_quantity: number;
  max_quantity: number | null;
  discount_percent: number;
  price_per_unit: number;
  label: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  initialTiers: DiscountTier[];
}

const STORE_ID = "b0000000-0000-0000-0000-000000000001";
const BASE_PRICE = 14.99;

export default function DiscountTierManager({ initialTiers }: Props) {
  const [tiers, setTiers] = useState<DiscountTier[]>(initialTiers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    min_quantity: 1,
    max_quantity: 9,
    discount_percent: 0,
    price_per_unit: BASE_PRICE,
    label: "",
  });

  const resetForm = () => {
    setForm({ min_quantity: 1, max_quantity: 9, discount_percent: 0, price_per_unit: BASE_PRICE, label: "" });
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      store_id: STORE_ID,
      min_quantity: form.min_quantity,
      max_quantity: form.max_quantity || null,
      discount_percent: form.discount_percent,
      price_per_unit: form.price_per_unit,
      label: form.label,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("volume_discount_tiers")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (!error && data) {
        setTiers((prev) => prev.map((t) => (t.id === editingId ? data as DiscountTier : t)));
      }
    } else {
      const { data, error } = await supabase
        .from("volume_discount_tiers")
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        setTiers((prev) => [...prev, data as DiscountTier].sort((a, b) => a.min_quantity - b.min_quantity));
      }
    }

    setSaving(false);
    resetForm();
  };

  const handleEdit = (tier: DiscountTier) => {
    setForm({
      min_quantity: tier.min_quantity,
      max_quantity: tier.max_quantity || 0,
      discount_percent: tier.discount_percent,
      price_per_unit: tier.price_per_unit,
      label: tier.label || "",
    });
    setEditingId(tier.id);
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discount tier?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("volume_discount_tiers").delete().eq("id", id);
    if (!error) {
      setTiers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Auto-calculate price when discount changes
  const updateDiscount = (discount: number) => {
    setForm((prev) => ({
      ...prev,
      discount_percent: discount,
      price_per_unit: Number((BASE_PRICE * (1 - discount / 100)).toFixed(2)),
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] mb-1 flex items-center gap-3">
            <Percent size={32} className="text-[#3d6b2a]" />
            Volume Discount Tiers
          </h1>
          <p className="text-[#7a7060]">{tiers.length} pricing tiers configured</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="px-6 py-3 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2 w-fit"
        >
          <Plus size={18} />
          Add Tier
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "Edit Tier" : "New Discount Tier"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g., Small Order"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-[#3d6b2a] focus:border-[#3d6b2a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
              <input
                type="number"
                value={form.min_quantity}
                onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-[#3d6b2a] focus:border-[#3d6b2a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Quantity</label>
              <input
                type="number"
                value={form.max_quantity}
                onChange={(e) => setForm({ ...form, max_quantity: Number(e.target.value) })}
                placeholder="∞"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-[#3d6b2a] focus:border-[#3d6b2a]"
              />
              <p className="text-xs text-[#7a7060] mt-1">0 = unlimited</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input
                type="number"
                value={form.discount_percent}
                onChange={(e) => updateDiscount(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-[#3d6b2a] focus:border-[#3d6b2a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price/Unit</label>
              <input
                type="number"
                step="0.01"
                value={form.price_per_unit}
                onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-[#3d6b2a] focus:border-[#3d6b2a]"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 bg-[#E8F5E3] rounded-lg">
            <p className="text-sm text-[#3d6b2a]">
              <strong>{form.label || "Tier"}</strong>: Orders of <strong>{form.min_quantity}{form.max_quantity ? `–${form.max_quantity}` : "+"}</strong> meals →{" "}
              <strong>{form.discount_percent}% off</strong> → <strong>${form.price_per_unit.toFixed(2)}</strong>/meal
              (base: ${BASE_PRICE})
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#3d6b2a] text-white font-semibold rounded-lg hover:bg-[#3d6b2a]/90 transition inline-flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? "Saving..." : editingId ? "Update Tier" : "Add Tier"}
            </button>
            <button onClick={resetForm} className="px-5 py-2 text-[#9a9080] hover:text-gray-900 transition inline-flex items-center gap-2">
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tiers Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Pricing Tiers</h3>
          <p className="text-sm text-[#9a9080]">Base price: ${BASE_PRICE}/meal</p>
        </div>

        {tiers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Label</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Quantity Range</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Price/Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Savings vs Base</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tiers.sort((a, b) => a.min_quantity - b.min_quantity).map((tier) => {
                  const savings = BASE_PRICE - tier.price_per_unit;
                  return (
                    <tr key={tier.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {tier.label || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tier.min_quantity.toLocaleString()} – {tier.max_quantity ? tier.max_quantity.toLocaleString() : "∞"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                          {tier.discount_percent}% off
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${tier.price_per_unit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#3d6b2a] font-medium">
                        {savings > 0 ? `-$${savings.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleEdit(tier)} className="text-[#9a9080] hover:text-[#3d6b2a] transition">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(tier.id)} className="text-[#9a9080] hover:text-red-600 transition">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Percent size={32} className="mx-auto mb-3 text-[#7a7060]" />
            <p className="text-[#9a9080]">No discount tiers configured. Add your first tier to get started.</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-[#E8F5E3] border border-[#3d6b2a]/20 rounded-2xl p-6">
        <h4 className="font-semibold text-[#3d6b2a] mb-2">How Volume Discounts Work</h4>
        <p className="text-sm text-[#3d6b2a]/80">
          Volume discounts are applied to single bulk orders based on total meal count.
          Tiers are shown on the public website's volume calculator. Changes here update the pricing
          displayed to customers in real-time.
        </p>
      </div>
    </div>
  );
}
