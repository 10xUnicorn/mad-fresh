"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Rocket, CheckCircle } from "lucide-react";
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

const floatingFoods = [
  { emoji: "🥑", top: "5%", left: "3%", size: "text-4xl", delay: "0s", duration: "18s" },
  { emoji: "🥦", top: "12%", right: "5%", size: "text-3xl", delay: "2s", duration: "22s" },
  { emoji: "🍋", top: "25%", left: "6%", size: "text-2xl", delay: "4s", duration: "20s" },
  { emoji: "🥬", top: "40%", right: "4%", size: "text-4xl", delay: "1s", duration: "24s" },
  { emoji: "🫑", top: "55%", left: "2%", size: "text-3xl", delay: "3s", duration: "19s" },
  { emoji: "🍃", top: "68%", right: "6%", size: "text-2xl", delay: "5s", duration: "21s" },
  { emoji: "🥒", top: "78%", left: "5%", size: "text-3xl", delay: "2s", duration: "23s" },
  { emoji: "🌿", top: "85%", right: "3%", size: "text-2xl", delay: "4s", duration: "17s" },
  { emoji: "🥝", top: "15%", left: "90%", size: "text-2xl", delay: "6s", duration: "20s" },
  { emoji: "🌱", top: "35%", left: "1%", size: "text-xl", delay: "7s", duration: "16s" },
  { emoji: "🍈", top: "92%", right: "10%", size: "text-2xl", delay: "3s", duration: "22s" },
];

export default function RegisterWaitlistPage() {
  return (
    <Suspense>
      <WaitlistContent />
    </Suspense>
  );
}

function WaitlistContent() {
  const searchParams = useSearchParams();
  const [time, setTime] = useState(getTimeLeft());
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prefillName = searchParams.get("name");
    const prefillEmail = searchParams.get("email");
    if (prefillName) setName(prefillName);
    if (prefillEmail) setEmail(prefillEmail);
  }, [searchParams]);

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

      if (dbError) {
        if (dbError.code === "23505") {
          setSubmitted(true);
        } else {
          setError("Something went wrong. Please try again.");
        }
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

  const fromRSVP = searchParams.get("name");

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      {/* === BACKGROUND === */}
      <div className="fixed inset-0 bg-[#faf8f3]" />

      {floatingFoods.map((food, i) => (
        <div
          key={i}
          className={`fixed ${food.size} opacity-[0.12] pointer-events-none select-none`}
          style={{
            top: food.top,
            left: food.left,
            right: food.right,
            animation: `floatFood ${food.duration} ease-in-out ${food.delay} infinite`,
          }}
        >
          {food.emoji}
        </div>
      ))}

      {/* === CONTENT === */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="w-full py-6 px-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <span className="text-2xl font-bold text-[#1e2d18] tracking-tight">
              MAD <span className="text-[#75F663]">FRESH</span>
            </span>
            <span className="text-xs text-[#75F663]/60 font-medium uppercase tracking-widest hidden sm:block">
              Tempe, Arizona
            </span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-16">
          <div className="max-w-2xl w-full text-center">
            {/* RSVP confirmation banner */}
            {fromRSVP && !submitted && (
              <div className="bg-[#3d6b2a]/10 border border-[#75F663]/20 rounded-2xl p-4 mb-8 inline-flex items-center gap-3">
                <CheckCircle size={20} className="text-[#75F663]" />
                <span className="text-sm text-[#75F663]">
                  You&apos;re RSVP&apos;d for the Launch Party! Now join the waitlist for early app access.
                </span>
              </div>
            )}

            {/* Countdown */}
            <div className="mb-12">
              <p className="text-sm font-semibold text-[#75F663] uppercase tracking-widest mb-4">
                Meal Prep Launch Countdown
              </p>
              <div className="flex justify-center gap-3 sm:gap-5">
                {digits.map((d) => (
                  <div
                    key={d.label}
                    className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 sm:px-6 py-4 min-w-[70px] shadow-lg shadow-[#449531]/5"
                  >
                    <p className="text-3xl sm:text-5xl font-black text-[#1e2d18] tabular-nums">
                      {String(d.value).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#75F663]/50 uppercase tracking-wider mt-1 font-medium">
                      {d.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-16 h-16 rounded-full bg-[#3d6b2a]/10 flex items-center justify-center mx-auto mb-6">
              <Rocket size={32} className="text-[#75F663]" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight mb-4">
              Weekly Meal Prep,<br />
              <span className="bg-gradient-to-r from-[#75F663] to-[#449531] bg-clip-text text-transparent">Delivered Fresh.</span>
            </h1>
            <p className="text-[#7a7060] text-lg mb-10 max-w-lg mx-auto">
              Chef-crafted protein bowls delivered weekly or ready for pickup.
              Join the waitlist for founding member pricing — lock in 5, 10, or 15 meals
              per week at rates that never go up.
            </p>

            {submitted ? (
              <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4 shadow-2xl shadow-[#449531]/5">
                <div className="w-16 h-16 rounded-full bg-[#3d6b2a]/10 flex items-center justify-center mx-auto">
                  <CheckCircle size={36} className="text-[#75F663]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1e2d18]">You&apos;re on the list!</h2>
                <p className="text-[#7a7060]">
                  We&apos;ll notify you when subscriptions go live. Founding members get
                  locked-in pricing for life — you won&apos;t miss it.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <a
                    href="https://madfresh.app"
                    className="font-semibold px-8 py-3 rounded-full text-center bg-gradient-to-r from-[#449531] to-[#75F663] text-[#1e2d18] hover:shadow-lg hover:shadow-[#449531]/25 transition-all"
                  >
                    Visit MadFresh.app
                  </a>
                  <a
                    href="https://instagram.com/eatmadfresh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/[0.08] text-[#1e2d18] font-semibold px-8 py-3 rounded-full text-center hover:bg-white/5 transition"
                  >
                    Follow on Instagram
                  </a>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 space-y-4 shadow-2xl shadow-[#449531]/5"
              >
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all"
                />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all"
                />
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold py-4 rounded-full text-lg disabled:opacity-50 transition-all bg-gradient-to-r from-[#449531] to-[#75F663] text-[#1e2d18] hover:shadow-lg hover:shadow-[#449531]/25 active:scale-[0.99]"
                >
                  {loading ? "Joining..." : "Join the Waitlist"}
                </button>
                <p className="text-xs text-[#1e2d18]/20">No spam. Unsubscribe anytime. We respect your inbox.</p>
              </form>
            )}
          </div>
        </div>

        <footer className="py-6 text-center relative z-10">
          <p className="text-xs text-[#1e2d18]/20">&copy; {new Date().getFullYear()} Mad Fresh Kitchen LLC</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes floatFood {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-20px) rotate(4deg); }
        }
      `}</style>
    </main>
  );
}
