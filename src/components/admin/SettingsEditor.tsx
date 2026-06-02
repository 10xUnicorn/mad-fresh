"use client";

import { useState } from "react";
import { Building, Clock, Truck, DollarSign, Save, X, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";

interface StoreData {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  operating_hours: Record<string, { open: string; close: string }> | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_radius_miles: number | null;
  delivery_fee: number | null;
  free_delivery_minimum: number | null;
  delivery_days: string[] | null;
  tax_rate: number | null;
}

interface OrgData {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  support_email: string | null;
  support_phone: string | null;
}

interface SettingsEditorProps {
  store: StoreData | null;
  org: OrgData | null;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

function InputField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#7a7060] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 placeholder-[#9a9080]"
      />
    </div>
  );
}

function DisplayRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#ddd8cc] last:border-b-0">
      <span className="text-[#7a7060] text-sm">{label}</span>
      <span className="text-[#1e2d18] font-medium text-sm">{value || "—"}</span>
    </div>
  );
}

export default function SettingsEditor({ store, org }: SettingsEditorProps) {
  // Section editing states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Business info form
  const [bizName, setBizName] = useState(store?.name || "");
  const [bizPhone, setBizPhone] = useState(store?.phone || "");
  const [bizEmail, setBizEmail] = useState(store?.email || "");
  const [bizAddr1, setBizAddr1] = useState(store?.address_line1 || "");
  const [bizAddr2, setBizAddr2] = useState(store?.address_line2 || "");
  const [bizCity, setBizCity] = useState(store?.city || "");
  const [bizState, setBizState] = useState(store?.state || "");
  const [bizZip, setBizZip] = useState(store?.zip_code || "");

  // Operating hours form
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    DAYS.reduce((acc, day) => {
      const h = store?.operating_hours?.[day];
      acc[day] = h ? { open: h.open, close: h.close, closed: false } : { open: "09:00", close: "17:00", closed: true };
      return acc;
    }, {} as Record<string, { open: string; close: string; closed: boolean }>)
  );

  // Delivery form
  const [deliveryEnabled, setDeliveryEnabled] = useState(store?.delivery_enabled ?? true);
  const [pickupEnabled, setPickupEnabled] = useState(store?.pickup_enabled ?? true);
  const [deliveryRadius, setDeliveryRadius] = useState(String(store?.delivery_radius_miles || ""));
  const [deliveryFee, setDeliveryFee] = useState(String(store?.delivery_fee || ""));
  const [freeDeliveryMin, setFreeDeliveryMin] = useState(String(store?.free_delivery_minimum || ""));
  const [deliveryDays, setDeliveryDays] = useState<string[]>(store?.delivery_days || ["sunday"]);

  // Tax form
  const [taxRate, setTaxRate] = useState(String(store?.tax_rate ? (store.tax_rate * 100).toFixed(2) : ""));

  // Org form
  const [orgName, setOrgName] = useState(org?.name || "");
  const [orgTimezone, setOrgTimezone] = useState(org?.timezone || "America/Phoenix");
  const [orgSupportEmail, setOrgSupportEmail] = useState(org?.support_email || "");
  const [orgSupportPhone, setOrgSupportPhone] = useState(org?.support_phone || "");

  const saveSection = async (section: string) => {
    setSaving(true);
    setMessage(null);

    try {
      let updateData: Record<string, unknown> = {};
      let table = "stores";
      let recordId = store?.id;

      switch (section) {
        case "business":
          updateData = {
            name: bizName, phone: bizPhone, email: bizEmail,
            address_line1: bizAddr1, address_line2: bizAddr2 || null,
            city: bizCity, state: bizState, zip_code: bizZip,
          };
          break;
        case "hours": {
          const opHours: Record<string, { open: string; close: string }> = {};
          for (const day of DAYS) {
            if (!hours[day].closed) {
              opHours[day] = { open: hours[day].open, close: hours[day].close };
            }
          }
          updateData = { operating_hours: opHours };
          break;
        }
        case "delivery":
          updateData = {
            delivery_enabled: deliveryEnabled,
            pickup_enabled: pickupEnabled,
            delivery_radius_miles: deliveryRadius ? parseFloat(deliveryRadius) : null,
            delivery_fee: deliveryFee ? parseFloat(deliveryFee) : null,
            free_delivery_minimum: freeDeliveryMin ? parseFloat(freeDeliveryMin) : null,
            delivery_days: deliveryDays,
          };
          break;
        case "tax":
          updateData = { tax_rate: taxRate ? parseFloat(taxRate) / 100 : null };
          break;
        case "organization":
          table = "organizations";
          recordId = org?.id;
          updateData = {
            name: orgName, timezone: orgTimezone,
            support_email: orgSupportEmail || null,
            support_phone: orgSupportPhone || null,
          };
          break;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id: recordId, data: updateData }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");

      setMessage({ type: "success", text: "Settings saved!" });
      setEditingSection(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setEditingSection(editingSection === section ? null : section);
  };

  const formatCurrency = (v: number | null | undefined) =>
    v !== null && v !== undefined ? `$${v.toFixed(2)}` : "—";
  const formatPct = (v: number | null | undefined) =>
    v !== null && v !== undefined ? `${(v * 100).toFixed(2)}%` : "—";

  return (
    <div className="space-y-4">
      {/* Toast */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === "success" ? "bg-green-500/10 text-green-700 border border-green-500/20"
            : "bg-red-50 text-red-600 border border-red-500/20"
        }`}>
          {message.type === "success" ? <Check size={16} /> : <X size={16} />}
          {message.text}
        </div>
      )}

      {/* ═══ BUSINESS INFO ═══ */}
      <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <button onClick={() => toggleSection("business")} className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f0ece3] transition">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3d6b2a]/10"><Building size={18} className="text-[#3d6b2a]" /></div>
            <div className="text-left">
              <h3 className="text-[#1e2d18] font-semibold">Business Information</h3>
              <p className="text-[#9a9080] text-xs">Store name, address, contact</p>
            </div>
          </div>
          {editingSection === "business" ? <ChevronUp size={18} className="text-[#7a7060]" /> : <ChevronDown size={18} className="text-[#7a7060]" />}
        </button>

        {editingSection === "business" && (
          <div className="px-6 pb-6 space-y-4 border-t border-[#ddd8cc] pt-4">
            <InputField label="Store Name" value={bizName} onChange={setBizName} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Phone" value={bizPhone} onChange={setBizPhone} type="tel" />
              <InputField label="Email" value={bizEmail} onChange={setBizEmail} type="email" />
            </div>
            <InputField label="Address Line 1" value={bizAddr1} onChange={setBizAddr1} />
            <InputField label="Address Line 2" value={bizAddr2} onChange={setBizAddr2} placeholder="Suite, Unit, etc." />
            <div className="grid grid-cols-3 gap-4">
              <InputField label="City" value={bizCity} onChange={setBizCity} />
              <InputField label="State" value={bizState} onChange={setBizState} />
              <InputField label="ZIP" value={bizZip} onChange={setBizZip} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingSection(null)} className="px-4 py-2 border border-[#ddd8cc] text-[#4a5e3a] rounded-lg text-sm hover:bg-[#f2efe8] transition">Cancel</button>
              <button onClick={() => saveSection("business")} disabled={saving} className="px-5 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          </div>
        )}

        {editingSection !== "business" && (
          <div className="px-6 pb-4 space-y-0">
            <DisplayRow label="Store Name" value={bizName} />
            <DisplayRow label="Phone" value={bizPhone} />
            <DisplayRow label="Email" value={bizEmail} />
            <DisplayRow label="Address" value={[bizAddr1, bizAddr2, `${bizCity}, ${bizState} ${bizZip}`].filter(Boolean).join(", ")} />
          </div>
        )}
      </div>

      {/* ═══ OPERATING HOURS ═══ */}
      <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <button onClick={() => toggleSection("hours")} className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f0ece3] transition">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3d6b2a]/10"><Clock size={18} className="text-[#3d6b2a]" /></div>
            <div className="text-left">
              <h3 className="text-[#1e2d18] font-semibold">Operating Hours</h3>
              <p className="text-[#9a9080] text-xs">Weekly schedule</p>
            </div>
          </div>
          {editingSection === "hours" ? <ChevronUp size={18} className="text-[#7a7060]" /> : <ChevronDown size={18} className="text-[#7a7060]" />}
        </button>

        {editingSection === "hours" && (
          <div className="px-6 pb-6 space-y-3 border-t border-[#ddd8cc] pt-4">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3 bg-[#f8f6f1] rounded-lg p-3">
                <label className="flex items-center gap-2 min-w-[120px]">
                  <input type="checkbox" checked={!hours[day].closed}
                    onChange={() => setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }))}
                    className="w-4 h-4 rounded border-[#ddd8cc] bg-[#f2efe8] text-[#3d6b2a]" />
                  <span className="text-[#1e2d18] text-sm font-medium">{DAY_LABELS[day]}</span>
                </label>
                {!hours[day].closed ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={hours[day].open}
                      onChange={(e) => setHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                      className="px-2 py-1.5 bg-white border border-[#ddd8cc] rounded text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a]" />
                    <span className="text-[#9a9080] text-xs">to</span>
                    <input type="time" value={hours[day].close}
                      onChange={(e) => setHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                      className="px-2 py-1.5 bg-white border border-[#ddd8cc] rounded text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a]" />
                  </div>
                ) : (
                  <span className="text-[#9a9080] text-sm italic">Closed</span>
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingSection(null)} className="px-4 py-2 border border-[#ddd8cc] text-[#4a5e3a] rounded-lg text-sm hover:bg-[#f2efe8] transition">Cancel</button>
              <button onClick={() => saveSection("hours")} disabled={saving} className="px-5 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          </div>
        )}

        {editingSection !== "hours" && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAYS.map(day => {
                const h = store?.operating_hours?.[day];
                return (
                  <div key={day} className="bg-[#f8f6f1] rounded-lg p-2.5 border border-[#ddd8cc]">
                    <p className="text-[#1e2d18] text-xs font-medium">{DAY_LABELS[day]}</p>
                    <p className="text-[#9a9080] text-[10px]">{h ? `${h.open} – ${h.close}` : "Closed"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ DELIVERY SETTINGS ═══ */}
      <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <button onClick={() => toggleSection("delivery")} className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f0ece3] transition">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3d6b2a]/10"><Truck size={18} className="text-[#3d6b2a]" /></div>
            <div className="text-left">
              <h3 className="text-[#1e2d18] font-semibold">Delivery Settings</h3>
              <p className="text-[#9a9080] text-xs">Delivery options, fees, and schedule</p>
            </div>
          </div>
          {editingSection === "delivery" ? <ChevronUp size={18} className="text-[#7a7060]" /> : <ChevronDown size={18} className="text-[#7a7060]" />}
        </button>

        {editingSection === "delivery" && (
          <div className="px-6 pb-6 space-y-4 border-t border-[#ddd8cc] pt-4">
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={deliveryEnabled} onChange={() => setDeliveryEnabled(!deliveryEnabled)}
                  className="w-4 h-4 rounded border-[#ddd8cc] bg-[#f2efe8] text-[#3d6b2a]" />
                <span className="text-[#1e2d18] text-sm">Delivery Enabled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pickupEnabled} onChange={() => setPickupEnabled(!pickupEnabled)}
                  className="w-4 h-4 rounded border-[#ddd8cc] bg-[#f2efe8] text-[#3d6b2a]" />
                <span className="text-[#1e2d18] text-sm">Pickup Enabled</span>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Delivery Radius (mi)" value={deliveryRadius} onChange={setDeliveryRadius} type="number" />
              <InputField label="Delivery Fee ($)" value={deliveryFee} onChange={setDeliveryFee} type="number" />
              <InputField label="Free Delivery Min ($)" value={freeDeliveryMin} onChange={setFreeDeliveryMin} type="number" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7a7060] mb-2">Delivery Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button key={day}
                    onClick={() => setDeliveryDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      deliveryDays.includes(day) ? "bg-[#3d6b2a] text-white" : "bg-[#f2efe8] text-[#7a7060] border border-[#ddd8cc]"
                    }`}>
                    {DAY_LABELS[day].slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingSection(null)} className="px-4 py-2 border border-[#ddd8cc] text-[#4a5e3a] rounded-lg text-sm hover:bg-[#f2efe8] transition">Cancel</button>
              <button onClick={() => saveSection("delivery")} disabled={saving} className="px-5 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          </div>
        )}

        {editingSection !== "delivery" && (
          <div className="px-6 pb-4 space-y-0">
            <DisplayRow label="Delivery" value={deliveryEnabled ? "Enabled" : "Disabled"} />
            <DisplayRow label="Pickup" value={pickupEnabled ? "Enabled" : "Disabled"} />
            <DisplayRow label="Delivery Fee" value={formatCurrency(store?.delivery_fee)} />
            <DisplayRow label="Free Delivery Min" value={formatCurrency(store?.free_delivery_minimum)} />
            <DisplayRow label="Delivery Days" value={deliveryDays.map(d => DAY_LABELS[d]?.slice(0, 3)).join(", ") || "—"} />
          </div>
        )}
      </div>

      {/* ═══ TAX & FEES ═══ */}
      <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <button onClick={() => toggleSection("tax")} className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f0ece3] transition">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3d6b2a]/10"><DollarSign size={18} className="text-[#3d6b2a]" /></div>
            <div className="text-left">
              <h3 className="text-[#1e2d18] font-semibold">Tax & Fees</h3>
              <p className="text-[#9a9080] text-xs">Tax rates and service fees</p>
            </div>
          </div>
          {editingSection === "tax" ? <ChevronUp size={18} className="text-[#7a7060]" /> : <ChevronDown size={18} className="text-[#7a7060]" />}
        </button>

        {editingSection === "tax" && (
          <div className="px-6 pb-6 space-y-4 border-t border-[#ddd8cc] pt-4">
            <InputField label="Tax Rate (%)" value={taxRate} onChange={setTaxRate} type="number" placeholder="8.60" />
            <p className="text-[#9a9080] text-xs">Enter as percentage (e.g. 8.60 for 8.60%)</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingSection(null)} className="px-4 py-2 border border-[#ddd8cc] text-[#4a5e3a] rounded-lg text-sm hover:bg-[#f2efe8] transition">Cancel</button>
              <button onClick={() => saveSection("tax")} disabled={saving} className="px-5 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          </div>
        )}

        {editingSection !== "tax" && (
          <div className="px-6 pb-4">
            <DisplayRow label="Tax Rate" value={formatPct(store?.tax_rate)} />
          </div>
        )}
      </div>

      {/* ═══ ORGANIZATION ═══ */}
      {org && (
        <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-2xl overflow-hidden">
          <button onClick={() => toggleSection("organization")} className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f0ece3] transition">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#3d6b2a]/10"><Building size={18} className="text-[#3d6b2a]" /></div>
              <div className="text-left">
                <h3 className="text-[#1e2d18] font-semibold">Organization</h3>
                <p className="text-[#9a9080] text-xs">Account and platform info</p>
              </div>
            </div>
            {editingSection === "organization" ? <ChevronUp size={18} className="text-[#7a7060]" /> : <ChevronDown size={18} className="text-[#7a7060]" />}
          </button>

          {editingSection === "organization" && (
            <div className="px-6 pb-6 space-y-4 border-t border-[#ddd8cc] pt-4">
              <InputField label="Organization Name" value={orgName} onChange={setOrgName} />
              <div>
                <label className="block text-xs font-medium text-[#7a7060] mb-1.5">Timezone</label>
                <select value={orgTimezone} onChange={(e) => setOrgTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a]">
                  <option value="America/Phoenix">America/Phoenix (MST)</option>
                  <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                  <option value="America/Denver">America/Denver (MST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/New_York">America/New York (EST)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Support Email" value={orgSupportEmail} onChange={setOrgSupportEmail} type="email" />
                <InputField label="Support Phone" value={orgSupportPhone} onChange={setOrgSupportPhone} type="tel" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingSection(null)} className="px-4 py-2 border border-[#ddd8cc] text-[#4a5e3a] rounded-lg text-sm hover:bg-[#f2efe8] transition">Cancel</button>
                <button onClick={() => saveSection("organization")} disabled={saving} className="px-5 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                </button>
              </div>
            </div>
          )}

          {editingSection !== "organization" && (
            <div className="px-6 pb-4 space-y-0">
              <DisplayRow label="Name" value={orgName} />
              <DisplayRow label="Timezone" value={orgTimezone} />
              <DisplayRow label="Currency" value={org.currency?.toUpperCase()} />
              <DisplayRow label="Plan" value={org.subscription_plan?.toUpperCase()} />
              <DisplayRow label="Support Email" value={orgSupportEmail} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
