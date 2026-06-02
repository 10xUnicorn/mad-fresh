"use client";

import { useState } from "react";
import {
  User,
  Star,
  MessageSquare,
  Tag,
  Utensils,
  Bell,
  Save,
  X,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContactData {
  id: string;
  // Personal Info
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  // Subscription & Meal Preferences
  subscription_status: string | null;
  subscription_plan_id: string | null;
  subscription_meal_size: string | null;
  subscription_cuisines: string[] | null;
  dietary_preferences: string[] | null;
  allergens: string[] | null;
  // Communication & Preferences
  is_newsletter_subscribed: boolean;
  preferred_delivery_day: string | null;
  preferred_delivery_time: string | null;
  auto_order_enabled: boolean;
  quick_purchase_enabled: boolean;
  notes: string | null;
  // Tags & Classification
  contact_type: string | null;
  tags: string[] | null;
  lead_score: number | null;
  food_personality_type: string | null;
  source: string | null;
}

interface Plan {
  id: string;
  name: string;
  price_weekly?: number | null;
  price_monthly?: number | null;
}

interface ContactEditorProps {
  contact: ContactData;
  plans: Plan[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CUISINE_OPTIONS = ["Indian", "Italian", "American", "Mad Fresh", "Special"];
const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Paleo", "Low-Carb", "Low-Sodium", "Nut-Free", "Halal"];
const ALLERGEN_OPTIONS = ["Nuts", "Peanuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish", "Fish", "Sesame", "Tree Nuts"];
const CONTACT_TYPES = ["customer", "lead", "vip", "partner", "vendor"];
const SOURCE_OPTIONS = ["organic", "referral", "instagram", "facebook", "google", "email_campaign", "event", "in_store", "other"];
const FOOD_PERSONALITY_TYPES = ["Explorer", "Comfort Seeker", "Health Nut", "Foodie", "Traditionalist", "Adventurer"];
const DELIVERY_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DELIVERY_TIMES = ["7:00 AM – 10:00 AM", "10:00 AM – 1:00 PM", "1:00 PM – 4:00 PM", "4:00 PM – 7:00 PM", "7:00 PM – 9:00 PM"];
const SUB_STATUSES = ["active", "paused", "cancelled", "pending", "trial"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#7a7060] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 placeholder-[#9a9080] disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#7a7060] mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white border border-[#ddd8cc]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChipToggle({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);

  return (
    <div>
      <label className="block text-xs font-medium text-[#7a7060] mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selected.includes(opt)
                ? "bg-[#3d6b2a] text-white"
                : "bg-[#f2efe8] text-[#7a7060] border border-[#ddd8cc] hover:border-[#ddd8cc]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[#1e2d18] text-sm font-medium">{label}</p>
        {description && <p className="text-[#9a9080] text-xs">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-[#3d6b2a]" : "bg-[#f2efe8]"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function DisplayRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#ddd8cc] last:border-b-0">
      <span className="text-[#7a7060] text-sm">{label}</span>
      <span className="text-[#1e2d18] font-medium text-sm text-right max-w-[55%] truncate">{value || "—"}</span>
    </div>
  );
}

function SectionCard({
  id,
  icon: Icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
  preview,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  preview?: React.ReactNode;
}) {
  return (
    <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#f0ece3] transition"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#3d6b2a]/10">
            <Icon size={18} className="text-[#3d6b2a]" />
          </div>
          <div className="text-left">
            <h3 className="text-[#1e2d18] font-semibold">{title}</h3>
            <p className="text-[#9a9080] text-xs">{subtitle}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-[#7a7060] shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-[#7a7060] shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-[#ddd8cc] px-6 pb-6 pt-4 space-y-4">
          {children}
        </div>
      )}
      {!open && preview && (
        <div className="px-6 pb-4 space-y-0">{preview}</div>
      )}
    </div>
  );
}

function SaveBar({
  onSave,
  onCancel,
  saving,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-[#ddd8cc] text-[#4a5e3a] rounded-lg text-sm hover:bg-[#f2efe8] transition"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save Changes
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContactEditor({ contact, plans }: ContactEditorProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Personal Info State ──
  const [firstName, setFirstName] = useState(contact.first_name || "");
  const [lastName, setLastName] = useState(contact.last_name || "");
  const [email, setEmail] = useState(contact.email || "");
  const [phone, setPhone] = useState(contact.phone || "");
  const [birthday, setBirthday] = useState(contact.birthday || "");
  const [addr1, setAddr1] = useState(contact.address_line1 || "");
  const [addr2, setAddr2] = useState(contact.address_line2 || "");
  const [city, setCity] = useState(contact.city || "");
  const [state, setState] = useState(contact.state || "");
  const [zip, setZip] = useState(contact.zip_code || "");

  // ── Subscription State ──
  const [subStatus, setSubStatus] = useState(contact.subscription_status || "");
  const [subPlanId, setSubPlanId] = useState(contact.subscription_plan_id || "");
  const [subMealSize, setSubMealSize] = useState(contact.subscription_meal_size || "");
  const [subCuisines, setSubCuisines] = useState<string[]>(contact.subscription_cuisines || []);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(contact.dietary_preferences || []);
  const [allergens, setAllergens] = useState<string[]>(contact.allergens || []);

  // ── Communication State ──
  const [newsletter, setNewsletter] = useState(contact.is_newsletter_subscribed);
  const [deliveryDay, setDeliveryDay] = useState(contact.preferred_delivery_day || "");
  const [deliveryTime, setDeliveryTime] = useState(contact.preferred_delivery_time || "");
  const [autoOrder, setAutoOrder] = useState(contact.auto_order_enabled);
  const [quickPurchase, setQuickPurchase] = useState(contact.quick_purchase_enabled);
  const [notes, setNotes] = useState(contact.notes || "");

  // ── Tags & Classification State ──
  const [contactType, setContactType] = useState(contact.contact_type || "");
  const [tags, setTags] = useState<string[]>(contact.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [leadScore, setLeadScore] = useState(contact.lead_score ?? 0);
  const [foodPersonality, setFoodPersonality] = useState(contact.food_personality_type || "");
  const [source, setSource] = useState(contact.source || "");

  // ── Helpers ──

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

  const save = async (section: string, data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");
      showToast("success", "Changes saved!");
      setOpenSection(null);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-500/10 text-green-700 border border-green-500/20"
              : "bg-red-50 text-red-600 border border-red-500/20"
          }`}
        >
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          {toast.text}
        </div>
      )}

      {/* ══ 1. PERSONAL INFO ══════════════════════════════════════════════════ */}
      <SectionCard
        id="personal"
        icon={User}
        title="Personal Information"
        subtitle="Name, contact details, birthday, address"
        open={openSection === "personal"}
        onToggle={() => toggleSection("personal")}
        preview={
          <>
            <DisplayRow label="Name" value={`${firstName} ${lastName}`.trim() || "—"} />
            <DisplayRow label="Email" value={email} />
            <DisplayRow label="Phone" value={phone} />
            <DisplayRow label="Birthday" value={birthday} />
            <DisplayRow
              label="Address"
              value={[addr1, addr2, city && state ? `${city}, ${state} ${zip}` : city || ""].filter(Boolean).join(", ")}
            />
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <InputField label="First Name" value={firstName} onChange={setFirstName} />
          <InputField label="Last Name" value={lastName} onChange={setLastName} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Email" value={email} onChange={setEmail} type="email" />
          <InputField label="Phone" value={phone} onChange={setPhone} type="tel" />
        </div>
        <InputField label="Birthday" value={birthday} onChange={setBirthday} type="date" />
        <InputField label="Address Line 1" value={addr1} onChange={setAddr1} placeholder="Street address" />
        <InputField label="Address Line 2" value={addr2} onChange={setAddr2} placeholder="Apt, Suite, Unit…" />
        <div className="grid grid-cols-3 gap-4">
          <InputField label="City" value={city} onChange={setCity} />
          <InputField label="State" value={state} onChange={setState} placeholder="AZ" />
          <InputField label="ZIP" value={zip} onChange={setZip} />
        </div>
        <SaveBar
          saving={saving}
          onCancel={() => setOpenSection(null)}
          onSave={() =>
            save("personal", {
              first_name: firstName,
              last_name: lastName || null,
              email: email || null,
              phone: phone || null,
              birthday: birthday || null,
              address_line1: addr1 || null,
              address_line2: addr2 || null,
              city: city || null,
              state: state || null,
              zip_code: zip || null,
            })
          }
        />
      </SectionCard>

      {/* ══ 2. SUBSCRIPTION & MEAL PREFERENCES ══════════════════════════════ */}
      <SectionCard
        id="subscription"
        icon={Utensils}
        title="Subscription & Meal Preferences"
        subtitle="Plan, meal size, cuisines, dietary needs"
        open={openSection === "subscription"}
        onToggle={() => toggleSection("subscription")}
        preview={
          <>
            <DisplayRow label="Status" value={subStatus} />
            <DisplayRow label="Plan" value={plans.find((p) => p.id === subPlanId)?.name} />
            <DisplayRow label="Meal Size" value={subMealSize} />
            <DisplayRow label="Cuisines" value={subCuisines.join(", ")} />
            <DisplayRow label="Dietary" value={dietaryPrefs.join(", ")} />
            <DisplayRow label="Allergens" value={allergens.join(", ")} />
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Subscription Status"
            value={subStatus}
            onChange={setSubStatus}
            placeholder="— Select status —"
            options={SUB_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          />
          <SelectField
            label="Subscription Plan"
            value={subPlanId}
            onChange={setSubPlanId}
            placeholder="— No plan —"
            options={plans.map((p) => ({
              value: p.id,
              label: p.name + (p.price_weekly ? ` ($${p.price_weekly}/wk)` : ""),
            }))}
          />
        </div>

        {/* Meal Size */}
        <div>
          <label className="block text-xs font-medium text-[#7a7060] mb-2">Meal Size</label>
          <div className="flex gap-3">
            {["S", "M", "L"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSubMealSize(size === subMealSize ? "" : size)}
                className={`w-14 h-10 rounded-lg text-sm font-bold transition-colors ${
                  subMealSize === size
                    ? "bg-[#3d6b2a] text-white"
                    : "bg-[#f2efe8] text-[#7a7060] border border-[#ddd8cc] hover:border-[#ddd8cc]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <ChipToggle
          label="Subscription Cuisines"
          options={CUISINE_OPTIONS}
          selected={subCuisines}
          onChange={setSubCuisines}
        />
        <ChipToggle
          label="Dietary Preferences"
          options={DIETARY_OPTIONS}
          selected={dietaryPrefs}
          onChange={setDietaryPrefs}
        />
        <ChipToggle
          label="Allergens"
          options={ALLERGEN_OPTIONS}
          selected={allergens}
          onChange={setAllergens}
        />
        <SaveBar
          saving={saving}
          onCancel={() => setOpenSection(null)}
          onSave={() =>
            save("subscription", {
              subscription_status: subStatus || null,
              subscription_plan_id: subPlanId || null,
              subscription_meal_size: subMealSize || null,
              subscription_cuisines: subCuisines.length ? subCuisines : null,
              dietary_preferences: dietaryPrefs.length ? dietaryPrefs : null,
              allergens: allergens.length ? allergens : null,
            })
          }
        />
      </SectionCard>

      {/* ══ 3. COMMUNICATION & PREFERENCES ══════════════════════════════════ */}
      <SectionCard
        id="communication"
        icon={MessageSquare}
        title="Communication & Preferences"
        subtitle="Newsletter, delivery schedule, automation, notes"
        open={openSection === "communication"}
        onToggle={() => toggleSection("communication")}
        preview={
          <>
            <DisplayRow label="Newsletter" value={newsletter ? "Subscribed" : "Not subscribed"} />
            <DisplayRow label="Preferred Delivery Day" value={deliveryDay} />
            <DisplayRow label="Preferred Time" value={deliveryTime} />
            <DisplayRow label="Auto-Order" value={autoOrder ? "Enabled" : "Disabled"} />
            <DisplayRow label="Quick Purchase" value={quickPurchase ? "Enabled" : "Disabled"} />
            {notes && <DisplayRow label="Notes" value={notes.length > 60 ? notes.slice(0, 60) + "…" : notes} />}
          </>
        }
      >
        <div className="space-y-1 bg-[#f8f6f1] rounded-xl p-4 border border-[#ddd8cc]">
          <Toggle
            label="Newsletter Subscribed"
            description="Receives promotional emails and updates"
            checked={newsletter}
            onChange={setNewsletter}
          />
          <Toggle
            label="Auto-Order Enabled"
            description="Automatically generates orders on subscription cycle"
            checked={autoOrder}
            onChange={setAutoOrder}
          />
          <Toggle
            label="Quick Purchase Enabled"
            description="Can complete purchases with one tap"
            checked={quickPurchase}
            onChange={setQuickPurchase}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Preferred Delivery Day"
            value={deliveryDay}
            onChange={setDeliveryDay}
            placeholder="— Any day —"
            options={DELIVERY_DAYS.map((d) => ({
              value: d,
              label: d.charAt(0).toUpperCase() + d.slice(1),
            }))}
          />
          <SelectField
            label="Preferred Delivery Time"
            value={deliveryTime}
            onChange={setDeliveryTime}
            placeholder="— Any time —"
            options={DELIVERY_TIMES.map((t) => ({ value: t, label: t }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#7a7060] mb-1.5">Internal Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add notes about this contact…"
            className="w-full px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 placeholder-[#9a9080] resize-none"
          />
        </div>
        <SaveBar
          saving={saving}
          onCancel={() => setOpenSection(null)}
          onSave={() =>
            save("communication", {
              is_newsletter_subscribed: newsletter,
              preferred_delivery_day: deliveryDay || null,
              preferred_delivery_time: deliveryTime || null,
              auto_order_enabled: autoOrder,
              quick_purchase_enabled: quickPurchase,
              notes: notes || null,
            })
          }
        />
      </SectionCard>

      {/* ══ 4. TAGS & CLASSIFICATION ═════════════════════════════════════════ */}
      <SectionCard
        id="tags"
        icon={Tag}
        title="Tags & Classification"
        subtitle="Contact type, tags, lead score, personality"
        open={openSection === "tags"}
        onToggle={() => toggleSection("tags")}
        preview={
          <>
            <DisplayRow label="Type" value={contactType} />
            <DisplayRow label="Source" value={source} />
            <DisplayRow label="Lead Score" value={leadScore !== null ? String(leadScore) : undefined} />
            <DisplayRow label="Food Personality" value={foodPersonality} />
            <DisplayRow label="Tags" value={tags.join(", ")} />
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Contact Type"
            value={contactType}
            onChange={setContactType}
            placeholder="— Select type —"
            options={CONTACT_TYPES.map((t) => ({
              value: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
          />
          <SelectField
            label="Source"
            value={source}
            onChange={setSource}
            placeholder="— Select source —"
            options={SOURCE_OPTIONS.map((s) => ({
              value: s,
              label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            }))}
          />
        </div>

        <SelectField
          label="Food Personality Type"
          value={foodPersonality}
          onChange={setFoodPersonality}
          placeholder="— None —"
          options={FOOD_PERSONALITY_TYPES.map((f) => ({ value: f, label: f }))}
        />

        {/* Lead Score Slider */}
        <div>
          <label className="block text-xs font-medium text-[#7a7060] mb-2">
            Lead Score —{" "}
            <span className="text-[#3d6b2a] font-bold">{leadScore}</span>
            <span className="text-[#9a9080]">/100</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={leadScore}
            onChange={(e) => setLeadScore(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-[#f2efe8] accent-[#3d6b2a] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#9a9080] mt-1">
            <span>0 — Cold</span>
            <span>50 — Warm</span>
            <span>100 — Hot</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-[#7a7060] mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3d6b2a]/10 border border-[#3d6b2a]/20 text-[#3d6b2a] text-xs font-semibold"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-600 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {tags.length === 0 && (
              <span className="text-[#9a9080] text-xs italic">No tags yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag…"
              className="flex-1 px-3 py-2 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a] placeholder-[#9a9080]"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-[#f2efe8] border border-[#ddd8cc] rounded-lg text-[#4a5e3a] hover:bg-[#f2efe8] hover:text-[#1e2d18] transition flex items-center gap-1 text-sm"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        <SaveBar
          saving={saving}
          onCancel={() => setOpenSection(null)}
          onSave={() =>
            save("tags", {
              contact_type: contactType || null,
              source: source || null,
              food_personality_type: foodPersonality || null,
              lead_score: leadScore,
              tags: tags.length ? tags : null,
            })
          }
        />
      </SectionCard>

      {/* ══ LEAD SCORE QUICK BADGE ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-2 text-xs text-[#9a9080]">
        <span>
          Contact ID:{" "}
          <code className="text-[#9a9080] font-mono">{contact.id}</code>
        </span>
        <span className="flex items-center gap-1">
          <Star size={11} className="text-yellow-700" fill="currentColor" />
          Lead Score: <strong className="text-yellow-700 ml-1">{leadScore}</strong>
        </span>
      </div>
    </div>
  );
}
