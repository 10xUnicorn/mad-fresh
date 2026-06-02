"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Edit2, Trash2, X, Save, Search,
  AlertCircle, CheckCircle, Building2, GraduationCap,
  Landmark, Heart, Calendar, DollarSign, FileText,
  ChevronDown, ChevronUp,
} from "lucide-react";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface CateringContract {
  id: string;
  store_id: string;
  client_name: string;
  client_type: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  billing_address: string | null;
  school_district: string | null;
  school_grade_levels: string | null;
  student_count: number | null;
  company_name: string | null;
  department: string | null;
  po_number: string | null;
  tax_exempt: boolean;
  tax_exempt_id: string | null;
  contract_number: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  renewal_notice_days: number | null;
  delivery_frequency: string;
  delivery_days: string[] | null;
  delivery_time: string | null;
  delivery_address: string | null;
  delivery_instructions: string | null;
  meals_per_delivery: number | null;
  price_per_meal: number | null;
  price_per_delivery: number | null;
  monthly_value: number | null;
  total_contract_value: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  payment_terms: string;
  requires_insurance_cert: boolean;
  insurance_cert_uploaded: boolean;
  requires_health_permit: boolean;
  health_permit_uploaded: boolean;
  requires_background_check: boolean;
  dietary_requirements: string[] | null;
  allergen_policy: string | null;
  package_id: string | null;
  internal_notes: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

interface ContractsManagerProps {
  initialContracts: CateringContract[];
}

const CLIENT_TYPES = [
  { value: "school", label: "School", icon: GraduationCap, color: "text-blue-600 bg-blue-500/15" },
  { value: "corporate", label: "Corporate", icon: Building2, color: "text-purple-600 bg-purple-500/15" },
  { value: "government", label: "Government", icon: Landmark, color: "text-amber-600 bg-amber-500/15" },
  { value: "healthcare", label: "Healthcare", icon: Heart, color: "text-red-600 bg-red-500/15" },
  { value: "nonprofit", label: "Nonprofit", icon: Heart, color: "text-pink-600 bg-pink-500/15" },
  { value: "event_venue", label: "Event Venue", icon: Calendar, color: "text-cyan-600 bg-cyan-500/15" },
  { value: "other", label: "Other", icon: FileText, color: "text-[#7a7060] bg-[#f2efe8]" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-[#f2efe8] text-[#7a7060]" },
  { value: "pending_approval", label: "Pending", color: "bg-yellow-500/15 text-yellow-700" },
  { value: "active", label: "Active", color: "bg-green-500/15 text-green-700" },
  { value: "paused", label: "Paused", color: "bg-orange-500/15 text-orange-600" },
  { value: "expired", label: "Expired", color: "bg-red-500/15 text-red-600" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/15 text-red-600" },
  { value: "renewed", label: "Renewed", color: "bg-blue-500/15 text-blue-600" },
];

const PAYMENT_TERMS = [
  { value: "prepaid", label: "Prepaid" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "on_delivery", label: "On Delivery" },
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const DEFAULT_FORM: Partial<CateringContract> = {
  client_name: "",
  client_type: "corporate",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  billing_contact_name: "",
  billing_contact_email: "",
  billing_address: "",
  school_district: "",
  school_grade_levels: "",
  student_count: null,
  company_name: "",
  department: "",
  po_number: "",
  tax_exempt: false,
  tax_exempt_id: "",
  contract_number: "",
  status: "draft",
  start_date: "",
  end_date: "",
  auto_renew: false,
  renewal_notice_days: 30,
  delivery_frequency: "weekly",
  delivery_days: [],
  delivery_time: "",
  delivery_address: "",
  delivery_instructions: "",
  meals_per_delivery: null,
  price_per_meal: null,
  price_per_delivery: null,
  monthly_value: null,
  total_contract_value: null,
  deposit_amount: null,
  deposit_paid: false,
  payment_terms: "net_30",
  requires_insurance_cert: false,
  requires_health_permit: false,
  requires_background_check: false,
  dietary_requirements: [],
  allergen_policy: "",
  internal_notes: "",
  special_instructions: "",
};

export default function ContractsManager({ initialContracts }: ContractsManagerProps) {
  const supabase = createClient();
  const [contracts, setContracts] = useState<CateringContract[]>(initialContracts);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [formData, setFormData] = useState<Partial<CateringContract>>(DEFAULT_FORM);
  const [showDelivery, setShowDelivery] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  const showNotification = useCallback((message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const getClientIcon = (type: string) => {
    const t = CLIENT_TYPES.find((c) => c.value === type);
    return t || CLIENT_TYPES[CLIENT_TYPES.length - 1];
  };

  const getStatusBadge = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...DEFAULT_FORM });
    setShowDelivery(false);
    setShowCompliance(false);
    setShowModal(true);
  };

  const openEdit = (contract: CateringContract) => {
    setEditingId(contract.id);
    setFormData({ ...contract });
    setShowDelivery(false);
    setShowCompliance(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.client_name?.trim()) {
      showNotification("Client name is required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        store_id: STORE_ID,
        client_name: formData.client_name,
        client_type: formData.client_type || "corporate",
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        billing_contact_name: formData.billing_contact_name || null,
        billing_contact_email: formData.billing_contact_email || null,
        billing_address: formData.billing_address || null,
        school_district: formData.school_district || null,
        school_grade_levels: formData.school_grade_levels || null,
        student_count: formData.student_count || null,
        company_name: formData.company_name || null,
        department: formData.department || null,
        po_number: formData.po_number || null,
        tax_exempt: formData.tax_exempt || false,
        tax_exempt_id: formData.tax_exempt_id || null,
        contract_number: formData.contract_number || null,
        status: formData.status || "draft",
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        auto_renew: formData.auto_renew || false,
        renewal_notice_days: formData.renewal_notice_days || 30,
        delivery_frequency: formData.delivery_frequency || "weekly",
        delivery_days: formData.delivery_days?.length ? formData.delivery_days : null,
        delivery_time: formData.delivery_time || null,
        delivery_address: formData.delivery_address || null,
        delivery_instructions: formData.delivery_instructions || null,
        meals_per_delivery: formData.meals_per_delivery || null,
        price_per_meal: formData.price_per_meal || null,
        price_per_delivery: formData.price_per_delivery || null,
        monthly_value: formData.monthly_value || null,
        total_contract_value: formData.total_contract_value || null,
        deposit_amount: formData.deposit_amount || null,
        deposit_paid: formData.deposit_paid || false,
        payment_terms: formData.payment_terms || "net_30",
        requires_insurance_cert: formData.requires_insurance_cert || false,
        requires_health_permit: formData.requires_health_permit || false,
        requires_background_check: formData.requires_background_check || false,
        dietary_requirements: formData.dietary_requirements?.length ? formData.dietary_requirements : null,
        allergen_policy: formData.allergen_policy || null,
        internal_notes: formData.internal_notes || null,
        special_instructions: formData.special_instructions || null,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("catering_contracts")
          .update(payload)
          .eq("id", editingId);
        if (updateError) throw updateError;
        setContracts(contracts.map((c) => (c.id === editingId ? { ...c, ...payload } as CateringContract : c)));
        showNotification("Contract updated", "success");
      } else {
        const { data, error: insertError } = await supabase
          .from("catering_contracts")
          .insert([payload])
          .select()
          .single();
        if (insertError) throw insertError;
        if (data) {
          setContracts([data as CateringContract, ...contracts]);
          showNotification("Contract created", "success");
        }
      }
      setShowModal(false);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this contract? This cannot be undone.")) return;
    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from("catering_contracts").delete().eq("id", id);
      if (deleteError) throw deleteError;
      setContracts(contracts.filter((c) => c.id !== id));
      showNotification("Contract deleted", "success");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleDeliveryDay = (day: string) => {
    const current = formData.delivery_days || [];
    setFormData({
      ...formData,
      delivery_days: current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    });
  };

  // Filtered contracts
  const filtered = contracts.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && c.client_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.client_name?.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q) ||
        c.contract_number?.toLowerCase().includes(q) ||
        c.company_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Stats
  const activeCount = contracts.filter((c) => c.status === "active").length;
  const totalMonthly = contracts
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (c.monthly_value || 0), 0);

  const inputClass = "w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 text-sm";
  const labelClass = "block text-xs font-medium text-[#7a7060] mb-1";

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-700 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4">
          <p className="text-[#9a9080] text-xs font-medium uppercase tracking-wider">Total Contracts</p>
          <p className="text-[#1e2d18] text-2xl font-bold mt-1">{contracts.length}</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4">
          <p className="text-[#9a9080] text-xs font-medium uppercase tracking-wider">Active</p>
          <p className="text-[#3d6b2a] text-2xl font-bold mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4">
          <p className="text-[#9a9080] text-xs font-medium uppercase tracking-wider">Monthly Revenue</p>
          <p className="text-[#1e2d18] text-2xl font-bold mt-1">{fmt(totalMonthly)}</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4">
          <p className="text-[#9a9080] text-xs font-medium uppercase tracking-wider">Client Types</p>
          <p className="text-[#1e2d18] text-2xl font-bold mt-1">{new Set(contracts.map((c) => c.client_type)).size}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-sm text-[#4a5e3a] focus:outline-none focus:border-[#3d6b2a]"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-sm text-[#4a5e3a] focus:outline-none focus:border-[#3d6b2a]"
          >
            <option value="all">All Types</option>
            {CLIENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080]" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-sm text-[#1e2d18] placeholder-[#9a9080] focus:outline-none focus:border-[#3d6b2a] w-48"
            />
          </div>
        </div>

        <button
          onClick={openCreate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#449531] text-white rounded-xl hover:bg-[#449531]/90 disabled:opacity-50 transition text-sm font-semibold"
        >
          <Plus size={16} /> New Contract
        </button>
      </div>

      {/* Contracts Table */}
      {filtered.length > 0 ? (
        <div className="bg-white border border-[#ddd8cc] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f2efe8] border-b border-[#ddd8cc]">
                  <th className="px-5 py-3 text-left text-[#7a7060] font-medium text-xs uppercase tracking-wider">Client</th>
                  <th className="px-5 py-3 text-left text-[#7a7060] font-medium text-xs uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-[#7a7060] font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-[#7a7060] font-medium text-xs uppercase tracking-wider">Period</th>
                  <th className="px-5 py-3 text-left text-[#7a7060] font-medium text-xs uppercase tracking-wider">Schedule</th>
                  <th className="px-5 py-3 text-right text-[#7a7060] font-medium text-xs uppercase tracking-wider">Monthly</th>
                  <th className="px-5 py-3 text-right text-[#7a7060] font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contract) => {
                  const clientType = getClientIcon(contract.client_type);
                  const statusBadge = getStatusBadge(contract.status);
                  const Icon = clientType.icon;
                  return (
                    <tr key={contract.id} className="border-b border-[#ddd8cc] hover:bg-[#f0ece3] transition">
                      <td className="px-5 py-3">
                        <p className="text-[#1e2d18] font-semibold">{contract.client_name}</p>
                        <p className="text-[#9a9080] text-xs">{contract.contact_name || "No contact"}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${clientType.color}`}>
                          <Icon size={12} />
                          {clientType.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#7a7060] text-xs">
                        {contract.start_date
                          ? `${new Date(contract.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${
                              contract.end_date
                                ? new Date(contract.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : "Ongoing"
                            }`
                          : "—"}
                        {contract.auto_renew && (
                          <span className="ml-1 text-[#3d6b2a] text-[10px]">Auto-renew</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[#7a7060] text-xs capitalize">
                        {contract.delivery_frequency}
                        {contract.delivery_days?.length
                          ? ` · ${contract.delivery_days.map((d) => d.slice(0, 3)).join(", ")}`
                          : ""}
                      </td>
                      <td className="px-5 py-3 text-right text-[#1e2d18] font-semibold">
                        {contract.monthly_value ? fmt(contract.monthly_value) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => openEdit(contract)}
                            className="p-1.5 text-[#7a7060] hover:text-[#1e2d18] hover:bg-[#f2efe8] rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="p-1.5 text-[#7a7060] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#ddd8cc] rounded-xl py-12 text-center">
          <FileText size={32} className="mx-auto text-[#9a9080] mb-3" />
          <p className="text-[#9a9080] text-sm">
            {contracts.length === 0
              ? "No contracts yet. Create your first contract to manage recurring catering clients."
              : "No contracts match your filters."}
          </p>
        </div>
      )}

      {/* ═══ Create/Edit Modal ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#ddd8cc] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#ddd8cc] shrink-0">
              <h2 className="text-xl font-bold text-[#1e2d18]">
                {editingId ? "Edit Contract" : "New Contract"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#f2efe8] rounded-lg transition text-[#7a7060] hover:text-[#1e2d18]">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">

              {/* Client Info */}
              <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#3d6b2a] uppercase tracking-widest">Client Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Client Name *</label>
                    <input type="text" value={formData.client_name || ""}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className={inputClass} placeholder="e.g., Mesa Unified School District" />
                  </div>
                  <div>
                    <label className={labelClass}>Client Type</label>
                    <select value={formData.client_type || "corporate"}
                      onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                      className={inputClass}>
                      {CLIENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Contact Name</label>
                    <input type="text" value={formData.contact_name || ""}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className={inputClass} placeholder="Primary contact" />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" value={formData.contact_email || ""}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className={inputClass} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input type="text" value={formData.contact_phone || ""}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className={inputClass} placeholder="(555) 123-4567" />
                  </div>
                </div>

                {/* School-specific fields */}
                {formData.client_type === "school" && (
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#ddd8cc]">
                    <div>
                      <label className={labelClass}>School District</label>
                      <input type="text" value={formData.school_district || ""}
                        onChange={(e) => setFormData({ ...formData, school_district: e.target.value })}
                        className={inputClass} placeholder="e.g., Mesa Unified" />
                    </div>
                    <div>
                      <label className={labelClass}>Grade Levels</label>
                      <input type="text" value={formData.school_grade_levels || ""}
                        onChange={(e) => setFormData({ ...formData, school_grade_levels: e.target.value })}
                        className={inputClass} placeholder="e.g., K-5, 6-8" />
                    </div>
                    <div>
                      <label className={labelClass}>Student Count</label>
                      <input type="number" value={formData.student_count || ""}
                        onChange={(e) => setFormData({ ...formData, student_count: parseInt(e.target.value) || null })}
                        className={inputClass} placeholder="250" />
                    </div>
                  </div>
                )}

                {/* Corporate-specific fields */}
                {(formData.client_type === "corporate" || formData.client_type === "government") && (
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#ddd8cc]">
                    <div>
                      <label className={labelClass}>Company Name</label>
                      <input type="text" value={formData.company_name || ""}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Department</label>
                      <input type="text" value={formData.department || ""}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>PO Number</label>
                      <input type="text" value={formData.po_number || ""}
                        onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                )}
              </div>

              {/* Contract Terms */}
              <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#3d6b2a] uppercase tracking-widest">Contract Terms</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Contract #</label>
                    <input type="text" value={formData.contract_number || ""}
                      onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                      className={inputClass} placeholder="MFK-2026-001" />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select value={formData.status || "draft"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={inputClass}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Payment Terms</label>
                    <select value={formData.payment_terms || "net_30"}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                      className={inputClass}>
                      {PAYMENT_TERMS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input type="date" value={formData.start_date || ""}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>End Date</label>
                    <input type="date" value={formData.end_date || ""}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className={inputClass} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.auto_renew || false}
                      onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 text-[#449531] focus:ring-[#449531] bg-transparent" />
                    <span className="text-sm text-[#4a5e3a]">Auto-renew</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.tax_exempt || false}
                      onChange={(e) => setFormData({ ...formData, tax_exempt: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 text-[#449531] focus:ring-[#449531] bg-transparent" />
                    <span className="text-sm text-[#4a5e3a]">Tax Exempt</span>
                  </label>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#3d6b2a] uppercase tracking-widest">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Meals per Delivery</label>
                    <input type="number" value={formData.meals_per_delivery || ""}
                      onChange={(e) => setFormData({ ...formData, meals_per_delivery: parseInt(e.target.value) || null })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Price per Meal</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080] text-sm">$</span>
                      <input type="number" step="0.01" value={formData.price_per_meal || ""}
                        onChange={(e) => setFormData({ ...formData, price_per_meal: parseFloat(e.target.value) || null })}
                        className={`${inputClass} pl-7`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Price per Delivery</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080] text-sm">$</span>
                      <input type="number" step="0.01" value={formData.price_per_delivery || ""}
                        onChange={(e) => setFormData({ ...formData, price_per_delivery: parseFloat(e.target.value) || null })}
                        className={`${inputClass} pl-7`} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Monthly Value</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080] text-sm">$</span>
                      <input type="number" step="0.01" value={formData.monthly_value || ""}
                        onChange={(e) => setFormData({ ...formData, monthly_value: parseFloat(e.target.value) || null })}
                        className={`${inputClass} pl-7`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Total Contract Value</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080] text-sm">$</span>
                      <input type="number" step="0.01" value={formData.total_contract_value || ""}
                        onChange={(e) => setFormData({ ...formData, total_contract_value: parseFloat(e.target.value) || null })}
                        className={`${inputClass} pl-7`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Deposit</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080] text-sm">$</span>
                      <input type="number" step="0.01" value={formData.deposit_amount || ""}
                        onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || null })}
                        className={`${inputClass} pl-7`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Schedule (collapsible) */}
              <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-xl overflow-hidden">
                <button type="button" onClick={() => setShowDelivery(!showDelivery)}
                  className="flex items-center justify-between w-full px-5 py-3 text-sm text-[#7a7060] hover:text-gray-200 transition">
                  <span className="font-bold uppercase tracking-widest text-xs">Delivery Schedule</span>
                  {showDelivery ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showDelivery && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[#ddd8cc] pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Frequency</label>
                        <select value={formData.delivery_frequency || "weekly"}
                          onChange={(e) => setFormData({ ...formData, delivery_frequency: e.target.value })}
                          className={inputClass}>
                          {FREQUENCY_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Delivery Time</label>
                        <input type="time" value={formData.delivery_time || ""}
                          onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                          className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Delivery Days</label>
                      <div className="flex gap-2 mt-1">
                        {WEEKDAYS.map((day) => (
                          <button key={day} type="button" onClick={() => toggleDeliveryDay(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                              (formData.delivery_days || []).includes(day)
                                ? "bg-[#449531] text-white"
                                : "bg-[#f2efe8] text-[#7a7060] border border-[#ddd8cc] hover:bg-[#f2efe8]"
                            }`}>
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Delivery Address</label>
                      <input type="text" value={formData.delivery_address || ""}
                        onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                        className={inputClass} placeholder="Full delivery address" />
                    </div>
                    <div>
                      <label className={labelClass}>Delivery Instructions</label>
                      <textarea value={formData.delivery_instructions || ""}
                        onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                        className={inputClass} rows={2} placeholder="Loading dock access, security codes, etc." />
                    </div>
                  </div>
                )}
              </div>

              {/* Compliance (collapsible) */}
              <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-xl overflow-hidden">
                <button type="button" onClick={() => setShowCompliance(!showCompliance)}
                  className="flex items-center justify-between w-full px-5 py-3 text-sm text-[#7a7060] hover:text-gray-200 transition">
                  <span className="font-bold uppercase tracking-widest text-xs">Compliance & Dietary</span>
                  {showCompliance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showCompliance && (
                  <div className="px-5 pb-5 space-y-4 border-t border-[#ddd8cc] pt-4">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.requires_insurance_cert || false}
                          onChange={(e) => setFormData({ ...formData, requires_insurance_cert: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 text-[#449531] focus:ring-[#449531] bg-transparent" />
                        <span className="text-sm text-[#4a5e3a]">Insurance Certificate</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.requires_health_permit || false}
                          onChange={(e) => setFormData({ ...formData, requires_health_permit: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 text-[#449531] focus:ring-[#449531] bg-transparent" />
                        <span className="text-sm text-[#4a5e3a]">Health Permit</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.requires_background_check || false}
                          onChange={(e) => setFormData({ ...formData, requires_background_check: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 text-[#449531] focus:ring-[#449531] bg-transparent" />
                        <span className="text-sm text-[#4a5e3a]">Background Checks</span>
                      </label>
                    </div>
                    <div>
                      <label className={labelClass}>Allergen Policy</label>
                      <textarea value={formData.allergen_policy || ""}
                        onChange={(e) => setFormData({ ...formData, allergen_policy: e.target.value })}
                        className={inputClass} rows={2} placeholder="Nut-free facility required, etc." />
                    </div>
                    <div>
                      <label className={labelClass}>Special Instructions</label>
                      <textarea value={formData.special_instructions || ""}
                        onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                        className={inputClass} rows={2} />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>Internal Notes</label>
                <textarea value={formData.internal_notes || ""}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  className={inputClass} rows={2} placeholder="Private notes (not visible to client)" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-[#ddd8cc] shrink-0">
              <button onClick={() => setShowModal(false)} disabled={loading}
                className="flex-1 px-4 py-2.5 border border-[#ddd8cc] text-[#7a7060] rounded-xl hover:bg-[#f2efe8] disabled:opacity-50 transition text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#449531] text-white rounded-xl hover:bg-[#449531]/90 disabled:opacity-50 transition text-sm font-semibold">
                <Save size={16} />
                {loading ? "Saving..." : "Save Contract"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
