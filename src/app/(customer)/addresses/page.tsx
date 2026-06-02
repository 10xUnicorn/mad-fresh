"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Plus, Trash2, Star, Edit3, Save, X, Loader2 } from "lucide-react";

interface Address {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  is_default: boolean;
}

const emptyAddress: Omit<Address, "id" | "user_id"> = {
  label: "",
  address_line1: "",
  address_line2: null,
  city: "",
  state: "",
  zip_code: "",
  latitude: null,
  longitude: null,
  delivery_instructions: null,
  is_default: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadAddresses(); }, []);

  const loadAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (data) setAddresses(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingId) {
      await supabase.from("user_addresses").update({
        label: form.label,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        delivery_instructions: form.delivery_instructions || null,
        is_default: form.is_default,
      }).eq("id", editingId);
    } else {
      // If setting as default, unset others
      if (form.is_default) {
        await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
      }

      await supabase.from("user_addresses").insert({
        user_id: user.id,
        ...form,
        address_line2: form.address_line2 || null,
        delivery_instructions: form.delivery_instructions || null,
      });
    }

    setEditingId(null);
    setShowNew(false);
    setForm(emptyAddress);
    await loadAddresses();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    await supabase.from("user_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    await loadAddresses();
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    setShowNew(false);
    setForm({
      label: addr.label,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2,
      city: addr.city,
      state: addr.state,
      zip_code: addr.zip_code,
      latitude: addr.latitude,
      longitude: addr.longitude,
      delivery_instructions: addr.delivery_instructions,
      is_default: addr.is_default,
    });
  };

  const startNew = () => {
    setEditingId(null);
    setShowNew(true);
    setForm({ ...emptyAddress, is_default: addresses.length === 0 });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNew(false);
    setForm(emptyAddress);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
      </div>
    );
  }

  const isEditing = editingId || showNew;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1e2d18]">Addresses</h1>
          <p className="text-[#7a7060] mt-1">Manage your delivery addresses</p>
        </div>
        {!isEditing && (
          <button onClick={startNew}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#3d6b2a] text-white font-semibold rounded-lg text-sm hover:bg-[#2f5720] transition">
            <Plus size={16} /> Add Address
          </button>
        )}
      </div>

      {/* Address Form (New or Edit) */}
      {isEditing && (
        <div className="bg-white border border-[#3d6b2a]/15 rounded-2xl p-6 space-y-4">
          <h2 className="text-[#1e2d18] font-bold">{editingId ? "Edit Address" : "New Address"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#7a7060] mb-1">Label</label>
              <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Home, Work, etc."
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7a7060] mb-1">Street Address</label>
              <input type="text" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                placeholder="123 Main St"
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7a7060] mb-1">Apt/Suite</label>
              <input type="text" value={form.address_line2 || ""} onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                placeholder="Apt 4B"
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7a7060] mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Tempe"
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7a7060] mb-1">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="AZ" maxLength={2}
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7a7060] mb-1">ZIP</label>
              <input type="text" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                placeholder="85281"
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#7a7060] mb-1">Delivery Instructions</label>
            <textarea value={form.delivery_instructions || ""} onChange={(e) => setForm({ ...form, delivery_instructions: e.target.value })}
              placeholder="Gate code, leave at door, etc."
              rows={2}
              className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531] resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-[#3d6b2a] focus:ring-[#449531]" />
            <span className="text-sm text-[#4a5e3a]">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || !form.label || !form.address_line1 || !form.city || !form.state || !form.zip_code}
              className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-[#3d6b2a] text-white font-semibold rounded-lg text-sm hover:bg-[#2f5720] transition disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save Address"}
            </button>
            <button onClick={cancelEdit}
              className="flex items-center gap-2 px-5 py-2.5 text-[#7a7060] hover:text-[#1e2d18] transition text-sm">
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Address Cards */}
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id}
              className={`bg-white border rounded-xl p-5 ${
                addr.is_default ? "border-[#3d6b2a]/15" : "border-[#ddd8cc]"
              }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className={addr.is_default ? "text-[#3d6b2a]" : "text-[#9a9080]"} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[#1e2d18] font-semibold">{addr.label}</p>
                      {addr.is_default && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#e9f0e4] text-[#3d6b2a]">DEFAULT</span>
                      )}
                    </div>
                    <p className="text-[#7a7060] text-sm mt-1">
                      {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}
                    </p>
                    <p className="text-[#9a9080] text-sm">{addr.city}, {addr.state} {addr.zip_code}</p>
                    {addr.delivery_instructions && (
                      <p className="text-[#9a9080] text-xs mt-1 italic">{addr.delivery_instructions}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr.id)} title="Set as default"
                      className="p-2 text-[#9a9080] hover:text-[#3d6b2a] transition rounded-lg hover:bg-[#f2efe8]">
                      <Star size={16} />
                    </button>
                  )}
                  <button onClick={() => startEdit(addr)} title="Edit"
                    className="p-2 text-[#9a9080] hover:text-[#1e2d18] transition rounded-lg hover:bg-[#f2efe8]">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} title="Delete"
                    className="p-2 text-[#9a9080] hover:text-red-600 transition rounded-lg hover:bg-[#f2efe8]">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !isEditing && (
        <div className="bg-white border border-[#ddd8cc] rounded-2xl p-12 text-center">
          <MapPin size={40} className="text-[#9a9080] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1e2d18] mb-2">No saved addresses</h2>
          <p className="text-[#7a7060] mb-6">Add a delivery address for faster checkout.</p>
          <button onClick={startNew}
            className="px-6 py-3 min-h-[44px] bg-[#3d6b2a] text-white font-semibold rounded-xl hover:bg-[#2f5720] transition inline-flex items-center gap-2">
            <Plus size={16} /> Add Address
          </button>
        </div>
      )}
    </div>
  );
}
