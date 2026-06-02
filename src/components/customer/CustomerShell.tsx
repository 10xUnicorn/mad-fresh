"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Home, UtensilsCrossed, ShoppingBag, Star, User,
  LogOut, Shield, Eye, ChevronRight, MapPin, Heart,
  Gift, Trophy, RefreshCw, Settings, Bell, ArrowLeft,
} from "lucide-react";

interface CustomerShellProps {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    stripe_customer_id: string | null;
  };
  isAdmin?: boolean;
  impersonating?: { id: string; name: string } | null;
  children: React.ReactNode;
}

// Bottom navigation tabs — 5 primary destinations
const bottomTabs = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Menu", href: "/order", icon: UtensilsCrossed },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Rewards", href: "/rewards", icon: Star },
  { name: "Account", href: "/account", icon: User },
];

export default function CustomerShell({ user, isAdmin, impersonating, children }: CustomerShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";

  // Determine active tab — match prefix for sub-routes
  const getActiveTab = () => {
    if (pathname === "/dashboard" || pathname === "/") return "/dashboard";
    if (pathname.startsWith("/orders")) return "/orders";
    if (pathname.startsWith("/order")) return "/order";
    if (pathname.startsWith("/rewards") || pathname.startsWith("/achievements")) return "/rewards";
    if (
      pathname.startsWith("/account") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/addresses") ||
      pathname.startsWith("/referrals") ||
      pathname.startsWith("/my-donations") ||
      pathname.startsWith("/subscription")
    ) return "/account";
    return pathname;
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-dvh bg-[#faf8f3] pb-[calc(env(safe-area-inset-bottom)+72px)] lg:pb-0">
      {/* Impersonation banner — always visible when active */}
      {impersonating && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-700 text-xs font-medium">
          <Eye size={14} />
          Viewing as <strong className="text-amber-900">{impersonating.name}</strong>
          {isAdmin && (
            <Link href="/admin" className="ml-2 underline hover:text-amber-600 transition">
              Back to Admin
            </Link>
          )}
        </div>
      )}

      {/* Top header — minimal, clean */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#ddd8cc] ${
          impersonating ? "mt-8" : ""
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left — Logo */}
          <Link href="/" className="text-lg font-black text-[#1e2d18] tracking-tight">
            MAD<span className="text-[#3d6b2a]">FRESH</span>
          </Link>

          {/* Right — admin link + avatar */}
          <div className="flex items-center gap-3">
            {isAdmin && !impersonating && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition"
              >
                <Shield size={12} />
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              className="w-9 h-9 rounded-full bg-[#e9f0e4] flex items-center justify-center text-xs font-bold text-[#3d6b2a] hover:bg-[#dce8d5] transition"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                initials
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-14 ${impersonating ? "pt-[88px]" : ""}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#ddd8cc]">
        <div className="max-w-lg mx-auto flex items-stretch justify-around" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {bottomTabs.map((tab) => {
            const isActive = activeTab === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-3 min-w-[64px] min-h-[52px] transition-all duration-200 ${
                  isActive
                    ? "text-[#3d6b2a]"
                    : "text-[#9a9080] hover:text-[#7a7060] active:text-[#4a5e3a]"
                }`}
              >
                <div className={`relative ${isActive ? "scale-110" : ""} transition-transform duration-200`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#3d6b2a]" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
