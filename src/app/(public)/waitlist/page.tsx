"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Rocket, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LAUNCH_DATE = new Date("2026-05-28T19:00:00-07:00");

function getTimeLeft() {
  const now = new Date();
  const diff = LAUNCH_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function WaitlistPage() {
  const [time, setTime] = useState(getTimeLeft());
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: dbError } = await supabase.from("contacts").upsert(
        {
          store_id: "b0000000-0000-0000-0000-000000000001",
          email,
          first_name: name.split(" ")[0] || name,
          last_name: name.split(" ").slice(1).join(" ") || null,
          source: "waitlist",
          tags: ["waitlist", "pre-launch"],
          is_newsletter_subscribed: true,
          is_waitlist_member: true,
        },
        { onConflict: "store_id,email" }
      );
      if (dbError && dbError.code !== "23505") {
        setError("Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const digits = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <main className="min-h-screen bg-[#faf8f3] flex items-center justify-center py-16 px-4">
      <div className="max-w-2xl mx-auto w-full text-center">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/images/brand/mad-fresh-logo.png" alt="Mad Fresh Kitchen" width={64} height={64}
            className="w-16 h-16 object-contain rounded-2xl shadow-sm" />
        </div>

        {/* Countdown */}
        <div className="mb-10">
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-5">
            Meal Prep Launch Countdown
          </p>
          <div className="flex justify-center gap-4 sm:gap-5">
            {digits.map((d) => (
              <div key={d.label} className="bg-white border border-[#ddd8cc] rounded-2xl px-4 sm:px-6 py-4 min-w-[70px] shadow-sm">
                <p className="text-3xl sm:text-5xl font-black text-[#1e2d18] tabular-nums">
                  {String(d.value).padStart(2, "0")}
                </p>
                <p className="text-[10px] sm:text-xs text-[#9a9080] uppercase tracking-wider mt-1">
                  {d.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Rocket size={36} className="text-[#3d6b2a] mx-auto mb-5" />
        <h1 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight mb-4">
          Weekly Meal Prep, Delivered Fresh.
        </h1>
        <p className="text-[#7a7060] text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          Chef-crafted protein bowls delivered weekly or ready for pickup.
          Join the waitlist for founding member pricing — lock in rates that never go up.
        </p>

        {submitted ? (
          <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 shadow-sm space-y-4">
            <CheckCircle size={48} className="text-[#3d6b2a] mx-auto" />
            <h2 className="text-2xl font-bold text-[#1e2d18]">You&apos;re on the list!</h2>
            <p className="text-[#7a7060]">
              We&apos;ll notify you when subscriptions go live. Founding members get locked-in pricing for life.
            </p>
            <Link
              href="/events/app-launch-party-2026"
              className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold inline-block px-8 py-3.5 rounded-full mt-2 transition-colors"
            >
              RSVP to the Launch Party
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-[#ddd8cc] rounded-2xl p-8 shadow-sm space-y-4">
            <input
              type="text" required placeholder="Your name" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a] focus:border-[#3d6b2a] transition text-base"
            />
            <input
              type="email" required placeholder="your@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a] focus:border-[#3d6b2a] transition text-base"
            />
            {error && <p className="text-[#dc2626] text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold py-4 rounded-full text-base disabled:opacity-50 transition-colors min-h-[52px]"
            >
              {loading ? "Joining..." : "Join the Waitlist"}
            </button>
            <p className="text-xs text-[#9a9080]">No spam. Unsubscribe anytime.</p>
          </form>
        )}

        <Link href="/" className="inline-flex items-center gap-2 text-[#9a9080] hover:text-[#3d6b2a] transition mt-8 text-sm">
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </div>
    </main>
  );
}
