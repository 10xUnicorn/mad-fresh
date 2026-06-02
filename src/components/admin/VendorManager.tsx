"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X, Truck, Phone, Mail } from "lucide-react";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days?: number;
  minimum_order_value?: number;
  is_active: boolean;
  notes?: string;
  store_id: string;
}

const emptyForm: Partial<Vendor> = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  payment_terms: "Net 30",
  lead_time_days: 3,
  minimum_order_value: 0,
  is_active: true,
  notes: "",
};

export default function VendorManager({ initialVendors }: { initialVendors: Vendor[] }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const supabase = createClient();

  const showNotify = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const openCreate = () => {
    setEditingVendor(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showNotify("Vendor name is required", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        payment_terms: formData.payment_terms || null,
        lead_time_days: formData.lead_time_days || null,
        minimum_order_value: formData.minimum_order_value || null,
        is_active: formData.is_active ?? true,
        notes: formData.notes || null,
        store_id: STORE_ID,
      };

      if (editingVendor?.id) {
        const { error } = await supabase
          .from("vendors")
          .update(payload)
          .eq("id", editingVendor.id);
        if (error) throw error;
        setVendors(vendors.map((v) => (v.id === editingVendor.id ? { ...v, ...payload } as Vendor : v)));
        showNotify("Vendor updated", "success");
      } else {
        const { data, error } = await supabase
          .from("vendors")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setVendors([...vendors, data as Vendor]);
        showNotify("Vendor created", "success");
      }
      setShowModal(false);
    } catch (err: any) {
      showNotify(err.message || "Failed to save vendor", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor?")) return;
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) {
      showNotify("Failed to delete vendor", "error");
      return;
    }
    setVendors(vendors.filter((v) => v.id !== id));
    showNotify("Vendor deleted", "success");
  };

  const activeCount = vendors.filter((v) => v.is_active).length;

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-[#1e2d18] text-sm ${notification.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] mb-1">Vendors</h1>
          <p className="text-[#7a7060]">{vendors.length} total vendors</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#3d6b2a] text-white rounded-lg hover:bg-[#1f5714] transition-colors"
        >
          <Plus size={20} />
          New Vendor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 bg-white border border-gray-200 shadow-sm rounded-lg p-4">
          <div className="p-3 rounded-lg bg-[#E8F5E3]">
            <Truck size={20} className="text-[#3d6b2a]" />
          </div>
          <div>
            <p className="text-[#9a9080] text-sm">Total Vendors</p>
            <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white border border-gray-200 shadow-sm rounded-lg p-4">
          <div className="p-3 rounded-lg bg-[#E8F5E3]">
            <Truck size={20} className="text-[#3d6b2a]" />
          </div>
          <div>
            <p className="text-[#9a9080] text-sm">Active Vendors</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Terms</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Lead Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Min Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9a9080]">{vendor.contact_person || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vendor.email ? (
                        <a href={`mailto:${vendor.email}`} className="text-[#3d6b2a] hover:underline flex items-center gap-1">
                          <Mail size={14} /> {vendor.email}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {vendor.phone ? (
                        <a href={`tel:${vendor.phone}`} className="text-[#3d6b2a] hover:underline flex items-center gap-1">
                          <Phone size={14} /> {vendor.phone}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9a9080]">{vendor.payment_terms || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9a9080]">
                      {vendor.lead_time_days ? `${vendor.lead_time_days} days` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9a9080]">
                      {vendor.minimum_order_value ? `$${vendor.minimum_order_value}` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {vendor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(vendor)} className="p-1.5 text-[#9a9080] hover:text-[#3d6b2a] hover:bg-green-50 rounded transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(vendor.id)} className="p-1.5 text-[#9a9080] hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[#9a9080]">
                    No vendors found. Click &quot;New Vendor&quot; to add your first supplier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVendor ? "Edit Vendor" : "New Vendor"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                  placeholder="e.g. Sysco, US Foods"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person || ""}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select
                    value={formData.payment_terms || "Net 30"}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                  >
                    <option>COD</option>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                    <option>Prepaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
                  <input
                    type="number"
                    value={formData.lead_time_days || ""}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order ($)</label>
                  <input
                    type="number"
                    value={formData.minimum_order_value || ""}
                    onChange={(e) => setFormData({ ...formData, minimum_order_value: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vendor-active"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]"
                />
                <label htmlFor="vendor-active" className="text-sm text-gray-700">Active vendor</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm text-[#1e2d18] bg-[#3d6b2a] rounded-lg hover:bg-[#1f5714] transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : editingVendor ? "Update Vendor" : "Create Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
