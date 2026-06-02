"use client";

import Link from "next/link";
import { Rocket, Calendar, ExternalLink, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ComingSoonPageProps {
  user: {
    first_name: string;
    email: string;
  };
}

export default function ComingSoonPage({ user }: ComingSoonPageProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-[#faf8f3] flex flex-col">
      {/* Header */}
      <header className="relative z-10 w-full py-6 px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <span className="text-xl font-black text-[#1e2d18] tracking-tight">
            MAD <span className="text-[#3d6b2a]">FRESH</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-[#9a9080] hover:text-[#1e2d18] transition"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16">
        <div className="max-w-xl w-full space-y-8">
          {/* Main card */}
          <div className="bg-white border border-[#ddd8cc] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-[0_8px_32px_rgba(30,45,24,.12)]">
            <div className="w-20 h-20 rounded-full bg-[#e9f0e4] flex items-center justify-center mx-auto">
              <Rocket size={40} className="text-[#3d6b2a]" />
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#1e2d18] mb-2">
                Coming Soon{user.first_name ? `, ${user.first_name}` : ""}!
              </h1>
              <p className="text-[#7a7060] text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                We&apos;ll let you know when our app is officially launched so you can place orders and access your dashboard.
              </p>
            </div>

            <div className="w-16 h-px bg-[#ddd8cc] mx-auto" />

            <div>
              <p className="text-[#4a5e3a] text-sm mb-4">
                In the meantime, join us at our upcoming app launch event at Mad Fresh Kitchen in Tempe!
              </p>
              <Link
                href="/events/app-launch-party-2026"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3d6b2a] text-white font-bold rounded-full text-sm hover:bg-[#2f5720] hover:shadow-lg hover:shadow-[#3d6b2a]/20 active:scale-[0.98] transition-all"
              >
                <Calendar size={18} />
                Register for Launch Party
              </Link>
            </div>
          </div>

          {/* Secondary info */}
          <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 text-center">
            <p className="text-[#9a9080] text-sm mb-3">
              Already registered? Follow us for updates.
            </p>
            <a
              href="https://instagram.com/madfreshkitchen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#3d6b2a] text-sm font-semibold hover:underline"
            >
              <ExternalLink size={14} />
              @madfreshkitchen
            </a>
          </div>

          {/* Signed in as */}
          <p className="text-center text-[#9a9080] text-xs">
            Signed in as <span className="text-[#7a7060]">{user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
