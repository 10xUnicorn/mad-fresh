"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Save, Loader2, CheckCircle2, Mail, Phone, Bell, Shield } from "lucide-react";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dietary_preferences: string[];
  allergens: string[];
  notification_preferences: { push: boolean; email: boolean; sms: boolean; marketing: boolean };
  is_newsletter_subscribed: boolean;
}

const DIETARY_OPTIONS = ["Gluten-Free", "Vegan", "Vegetarian", "Keto", "Paleo", "Low-Sodium", "Dairy-Free", "Nut-Free"];
const ALLERGEN_OPTIONS = ["Peanuts", "Tree Nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Shellfish", "Sesame"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "", last_name: "", email: "", phone: "",
    dietary_preferences: [], allergens: [],
    notification_preferences: { push: true, email: true, sms: false, marketing: true },
    is_newsletter_subscribed: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
        dietary_preferences: data.dietary_preferences || [],
        allergens: data.allergens || [],
        notification_preferences: data.notification_preferences || { push: true, email: true, sms: false, marketing: true },
        is_newsletter_subscribed: data.is_newsletter_subscribed ?? true,
      });
    } else {
      setProfile((prev) => ({ ...prev, email: user.email || "" }));
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_profiles").upsert({
      id: user.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      dietary_preferences: profile.dietary_preferences,
      allergens: profile.allergens,
      notification_preferences: profile.notification_preferences,
      is_newsletter_subscribed: profile.is_newsletter_subscribed,
      updated_at: new Date().toISOString(),
    });

    // Sync email with Supabase Auth if changed
    if (profile.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: profile.email });
      if (authError) {
        console.error("Auth email update error:", authError);
      }
    }

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#1e2d18]">Profile</h1>
        <p className="text-[#7a7060] mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Personal Info */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <User size={18} className="text-[#3d6b2a]" />
          <h2 className="text-[#1e2d18] font-bold">Personal Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#7a7060] mb-1">First Name</label>
            <input type="text" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531] min-h-[44px]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7a7060] mb-1">Last Name</label>
            <input type="text" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531] min-h-[44px]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7a7060] mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080]" />
              <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg pl-9 pr-3 py-2.5 text-[#1e2d18] text-base focus:outline-none focus:ring-2 focus:ring-[#449531] min-h-[44px]" />
            </div>
            <p className="text-[10px] text-[#9a9080]">Changing your email will require confirmation via the new address.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7a7060] mb-1">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080]" />
              <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg pl-9 pr-3 py-2.5 text-[#1e2d18] text-base placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#449531] min-h-[44px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#3d6b2a]" />
          <h2 className="text-[#1e2d18] font-bold">Dietary Preferences</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <button key={opt}
              onClick={() => setProfile({ ...profile, dietary_preferences: toggleArray(profile.dietary_preferences, opt.toLowerCase().replace(/[- ]/g, "_")) })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                profile.dietary_preferences.includes(opt.toLowerCase().replace(/[- ]/g, "_"))
                  ? "bg-[#e9f0e4] border-[#3d6b2a]/15 text-[#3d6b2a]"
                  : "bg-[#f2efe8] border-[#ddd8cc] text-[#7a7060] hover:border-[#9a9080]"
              }`}>
              {opt}
            </button>
          ))}
        </div>

        <div>
          <h3 className="text-[#1e2d18] font-semibold text-sm mb-3">Allergens</h3>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((opt) => (
              <button key={opt}
                onClick={() => setProfile({ ...profile, allergens: toggleArray(profile.allergens, opt.toLowerCase()) })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  profile.allergens.includes(opt.toLowerCase())
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-[#f2efe8] border-[#ddd8cc] text-[#7a7060] hover:border-[#9a9080]"
                }`}>
              {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[#3d6b2a]" />
          <h2 className="text-[#1e2d18] font-bold">Notifications</h2>
        </div>
        {[
          { key: "email" as const, label: "Email Notifications", desc: "Order updates and receipts" },
          { key: "sms" as const, label: "SMS Notifications", desc: "Delivery alerts and reminders" },
          { key: "marketing" as const, label: "Marketing", desc: "Promotions, new menu items, events" },
        ].map((item) => (
          <label key={item.key} className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <p className="text-[#1e2d18] text-sm font-medium">{item.label}</p>
              <p className="text-[#9a9080] text-xs">{item.desc}</p>
            </div>
            <div className="relative">
              <input type="checkbox"
                checked={profile.notification_preferences[item.key]}
                onChange={(e) => setProfile({
                  ...profile,
                  notification_preferences: { ...profile.notification_preferences, [item.key]: e.target.checked },
                })}
                className="sr-only" />
              <div className={`w-10 h-6 rounded-full transition ${profile.notification_preferences[item.key] ? "bg-[#3d6b2a]" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${profile.notification_preferences[item.key] ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </div>
          </label>
        ))}

        <label className="flex items-center justify-between py-2 cursor-pointer border-t border-[#ddd8cc] pt-4">
          <div>
            <p className="text-[#1e2d18] text-sm font-medium">Newsletter</p>
            <p className="text-[#9a9080] text-xs">Weekly updates and exclusive offers</p>
          </div>
          <div className="relative">
            <input type="checkbox" checked={profile.is_newsletter_subscribed}
              onChange={(e) => setProfile({ ...profile, is_newsletter_subscribed: e.target.checked })} className="sr-only" />
            <div className={`w-10 h-6 rounded-full transition ${profile.is_newsletter_subscribed ? "bg-[#3d6b2a]" : "bg-gray-300"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${profile.is_newsletter_subscribed ? "translate-x-5" : "translate-x-1"}`} />
            </div>
          </div>
        </label>
      </div>

      {/* Save */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 sm:py-3 bg-[#3d6b2a] text-white font-bold rounded-xl hover:bg-[#2f5720] transition disabled:opacity-50 min-h-[44px] w-full sm:w-auto" style={{minHeight: '44px'}}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {saveSuccess && (
          <span className="flex items-center gap-1 text-green-400 text-sm">
            <CheckCircle2 size={16} /> Saved!
          </span>
        )}
      </div>
    </div>
  );
}
