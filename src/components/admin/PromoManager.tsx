"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Tag, Trash2, Edit3, ToggleLeft, ToggleRight,
  Calendar, Copy, Loader, X, Check, Percent, DollarSign,
  Gift, Truck, Users, Globe, Eye, EyeOff
} from "lucide-react";

interface Promo {
  id: string;
  name: string;
  display_title: string | null;
  description: string | null;
  code: string;
  type: string;
  value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  max_uses_total: number | null;
  max_uses_per_user: number | null;
  current_uses: number;
  applies_to: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  show_on_website: boolean;
  is_referral_reward: boolean;
  is_founding_member: boolean;
  created_at: string;
}

const TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage Off", icon: Percent },
  { value: "fixed_amount", label: "Fixed Amount Off", icon: DollarSign },
  { value: "free_item", label: "Free Item", icon: Gift },
  { value: "bogo", label: "Buy One Get One", icon: Copy },
  { value: "free_delivery", label: "Free Delivery", icon: Truck },
  { value: "first_order_free", label: "First Order Free", icon: Gift },
];

const APPLIES_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "subscription", label: "Subscriptions Only" },
  { value: "one_time", label: "One-Time Orders Only" },
  { value: "catering", label: "Catering Only" },
];

const emptyForm = {
  name: "", displayTitle: "", description: "", code: "",
  type: "percentage", value: 0, minOrderAmount: "",
  maxDiscountAmount: "", maxUsesTotal: "", maxUsesPerUser: "1",
  appliesTo: "all", startDate: "", endDate: "",
  isActive: true, showOnWebsite: false,
};

export default function PromoManager() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/admin/promos");
      if (!res.ok) throw new Error();
      setPromos(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      displayTitle: p.display_title || "",
      description: p.description || "",
      code: p.code,
      type: p.type,
      value: p.value,
      minOrderAmount: p.min_order_amount?.toString() || "",
      maxDiscountAmount: p.max_discount_amount?.toString() || "",
      maxUsesTotal: p.max_uses_total?.toString() || "",
      maxUsesPerUser: p.max_uses_per_user?.toString() || "1",
      appliesTo: p.applies_to || "all",
      startDate: p.start_date ? p.start_date.split("T")[0] : "",
      endDate: p.end_date ? p.end_date.split("T")[0] : "",
      isActive: p.is_active,
      showOnWebsite: p.show_on_website,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.type) return;
    setSaving(true);

    const payload: any = {
      name: form.name,
      displayTitle: form.displayTitle || null,
      description: form.description || null,
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      maxUsesTotal: form.maxUsesTotal ? Number(form.maxUsesTotal) : null,
      maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : 1,
      appliesTo: form.appliesTo,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      isActive: form.isActive,
      showOnWebsite: form.showOnWebsite,
    };

    try {
      const method = editingId ? "PUT" : "POST";
      if (editingId) payload.id = editingId;

      const res = await fetch("/api/admin/promos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setShowModal(false);
      fetchPromos();
    } catch (err: any) {
      alert(err.message);
    } finally { setSaving(false); }
  };

  const toggleActive = async (p: Promo) => {
    await fetch("/api/admin/promos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, isActive: !p.is_active }),
    });
    fetchPromos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code? This cannot be undone.")) return;
    await fetch(`/api/admin/promos?id=${id}`, { method: "DELETE" });
    fetchPromos();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatus = (p: Promo) => {
    if (!p.is_active) return { label: "Inactive", color: "bg-gray-100 text-[#9a9080]" };
    const now = new Date();
    if (p.start_date && new Date(p.start_date) > now) return { label: "Scheduled", color: "bg-blue-50 text-blue-600" };
    if (p.end_date && new Date(p.end_date) < now) return { label: "Expired", color: "bg-red-50 text-red-500" };
    if (p.max_uses_total && p.current_uses >= p.max_uses_total) return { label: "Maxed Out", color: "bg-amber-50 text-amber-600" };
    return { label: "Active", color: "bg-green-50 text-green-600" };
  };

  const formatValue = (p: Promo) => {
    if (p.type === "percentage") return `${p.value}% off`;
    if (p.type === "fixed_amount") return `$${p.value} off`;
    if (p.type === "free_delivery") return "Free delivery";
    if (p.type === "bogo") return "BOGO";
    if (p.type === "free_item") return "Free item";
    if (p.type === "first_order_free") return "First order free";
    return `${p.value}`;
  };

  const filtered = promos.filter(p => {
    if (filterActive !== null && p.is_active !== filterActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader size={24} className="animate-spin text-[#3d6b2a]" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2d18] flex items-center gap-2">
            <Tag size={24} className="text-[#3d6b2a]" /> Promo Codes
          </h1>
          <p className="text-sm text-[#4a5e3a] mt-1">{promos.length} codes &middot; {promos.filter(p => p.is_active).length} active</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-semibold rounded-xl transition inline-flex items-center gap-2">
          <Plus size={18} /> New Promo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060]" />
          <input type="text" placeholder="Search promos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20" />
        </div>
        <div className="flex gap-2">
          {[
            { label: "All", val: null },
            { label: "Active", val: true },
            { label: "Inactive", val: false },
          ].map(f => (
            <button key={f.label} onClick={() => setFilterActive(f.val)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                filterActive === f.val ? "bg-[#3d6b2a] text-white" : "bg-[#f2efe8] text-[#4a5e3a] hover:bg-[#f0ece3]"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promo List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filtered.map(p => {
              const status = getStatus(p);
              return (
                <div key={p.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition sm:items-center sm:gap-4 sm:px-5 sm:py-4">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5E3] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 sm:w-10 sm:h-10">
                    <Tag size={16} className="text-[#3d6b2a] sm:hidden" />
                    <Tag size={18} className="text-[#3d6b2a] hidden sm:block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => copyCode(p.code)}
                          className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200 transition flex items-center gap-1 shrink-0">
                          {p.code} {copiedCode === p.code ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                        </button>
                        <span className="text-[11px] text-[#9a9080] shrink-0">{formatValue(p)}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] text-[#7a7060] shrink-0">{p.current_uses}{p.max_uses_total ? `/${p.max_uses_total}` : ""} used</span>
                        {p.start_date && (
                          <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5 shrink-0">
                            <Calendar size={10} /> {new Date(p.start_date).toLocaleDateString()}
                            {p.end_date && ` – ${new Date(p.end_date).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.show_on_website && <Eye size={14} className="text-blue-600 mx-0.5" />}
                    <button onClick={() => toggleActive(p)} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title={p.is_active ? "Deactivate" : "Activate"}>
                      {p.is_active ? <ToggleRight size={20} className="text-[#3d6b2a]" /> : <ToggleLeft size={20} className="text-[#7a7060]" />}
                    </button>
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded-lg text-[#9a9080] transition"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-600 transition"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Tag size={36} className="mx-auto mb-3 text-[#4a5e3a]" />
            <p className="text-[#9a9080] font-medium">{searchQuery ? "No promos match your search" : "No promo codes yet"}</p>
            <button onClick={openCreate} className="mt-4 px-5 py-2.5 bg-[#3d6b2a] text-white font-semibold rounded-xl hover:bg-[#2f5720] transition inline-flex items-center gap-2 text-sm">
              <Plus size={16} /> Create First Promo
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? "Edit Promo" : "New Promo Code"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-[#9a9080]"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" placeholder="Summer Sale" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] font-mono uppercase text-gray-900" placeholder="SUMMER25" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Display Title</label>
                <input type="text" value={form.displayTitle} onChange={e => setForm(f => ({ ...f, displayTitle: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" placeholder="Save 25% this summer!" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] resize-none text-gray-900" placeholder="Internal notes about this promo..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Type *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] bg-white text-gray-900">
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    {form.type === "percentage" ? "Percentage" : "Amount"} *
                  </label>
                  <input type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900"
                    placeholder={form.type === "percentage" ? "25" : "10.00"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Min Order $</label>
                  <input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" placeholder="No minimum" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Max Discount $</label>
                  <input type="number" min="0" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" placeholder="No limit" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Total Uses</label>
                  <input type="number" min="0" value={form.maxUsesTotal} onChange={e => setForm(f => ({ ...f, maxUsesTotal: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Per User</label>
                  <input type="number" min="1" value={form.maxUsesPerUser} onChange={e => setForm(f => ({ ...f, maxUsesPerUser: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" placeholder="1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Applies To</label>
                  <select value={form.appliesTo} onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] bg-white text-gray-900">
                    {APPLIES_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] text-gray-900" />
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]" />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.showOnWebsite} onChange={e => setForm(f => ({ ...f, showOnWebsite: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]" />
                  <span className="text-sm font-medium text-gray-700">Show on website</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 sm:rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 transition min-h-[44px]">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.code}
                className="flex-1 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg transition disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2">
                {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : editingId ? "Update Promo" : "Create Promo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
