"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  User, MapPin, Heart, Gift, Trophy, RefreshCw,
  ChevronRight, LogOut, Star, Shield, Settings,
  Bell, CreditCard, HelpCircle, FileText, ExternalLink,
} from "lucide-react";
import NotificationPreferences from "@/components/customer/NotificationPreferences";

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  phone: string;
}

const accountSections = [
  {
    label: "My Stuff",
    items: [
      { name: "Subscription", href: "/subscription", icon: RefreshCw, desc: "Manage your meal plan" },
      { name: "Achievements", href: "/achievements", icon: Trophy, desc: "Badges & milestones" },
      { name: "Donations", href: "/my-donations", icon: Heart, desc: "Your giving history" },
      { name: "Referrals", href: "/referrals", icon: Gift, desc: "Share & earn rewards" },
    ],
  },
  {
    label: "Settings",
    items: [
      { name: "Profile & Preferences", href: "/profile", icon: User, desc: "Name, diet, allergens" },
      { name: "Saved Addresses", href: "/addresses", icon: MapPin, desc: "Delivery locations" },
    ],
  },
  {
    label: "Support",
    items: [
      { name: "Help & Contact", href: "mailto:hello@madfresh.app", icon: HelpCircle, desc: "Get in touch", external: true },
      { name: "Terms & Privacy", href: "/terms", icon: FileText, desc: "Legal stuff", external: true },
    ],
  },
];

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          // Session expired or not authenticated — redirect to login
          window.location.href = "/login?redirect=/account";
          return;
        }

        const { data } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, avatar_url, phone")
          .eq("id", user.id)
          .single();

        setProfile({
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          email: user.email || "",
          avatar_url: data?.avatar_url || null,
          phone: data?.phone || "",
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load account:", err);
        setError("Something went wrong loading your account. Please try again.");
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const initials = profile
    ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#3d6b2a]/30 border-t-[#3d6b2a] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-600 text-sm text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl text-sm font-medium text-[#1e2d18] bg-[#f2efe8] hover:bg-[#f0ece3] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#e9f0e4] flex items-center justify-center text-xl font-bold text-[#3d6b2a]">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#1e2d18] truncate">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-sm text-[#9a9080] truncate">{profile?.email}</p>
            {profile?.phone && (
              <p className="text-xs text-[#9a9080] mt-0.5">{profile.phone}</p>
            )}
          </div>
          <Link
            href="/profile"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#f2efe8] hover:bg-[#f0ece3] transition"
          >
            <Settings size={16} className="text-[#7a7060]" />
          </Link>
        </div>
      </div>

      {/* Account sections */}
      {accountSections.map((section) => (
        <div key={section.label}>
          <h2 className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-2 px-1">
            {section.label}
          </h2>
          <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden divide-y divide-[#ede9e2]">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isExternal = "external" in item && item.external;
              const Comp = isExternal ? "a" : Link;
              const extraProps = isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};

              return (
                <Comp
                  key={item.name}
                  href={item.href}
                  {...extraProps}
                  className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#f0ece3] transition active:bg-[#f0ece3] min-h-[52px]"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#f2efe8] flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-[#7a7060]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1e2d18]">{item.name}</p>
                    <p className="text-xs text-[#9a9080]">{item.desc}</p>
                  </div>
                  {isExternal ? (
                    <ExternalLink size={14} className="text-[#9a9080] flex-shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-[#9a9080] flex-shrink-0" />
                  )}
                </Comp>
              );
            })}
          </div>
        </div>
      ))}

      {/* Notification Preferences */}
      <div>
        <h2 className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider mb-2 px-1">
          Notifications
        </h2>
        <NotificationPreferences />
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition active:bg-red-100 min-h-[48px]"
      >
        <LogOut size={16} />
        Sign Out
      </button>

      <p className="text-center text-[11px] text-[#9a9080] pb-2">
        Mad Fresh Kitchen v1.0
      </p>
    </div>
  );
}
