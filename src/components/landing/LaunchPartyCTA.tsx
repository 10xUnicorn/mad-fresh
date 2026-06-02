"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const floatingFoods = [
  { emoji: "🥑", top: "5%", left: "3%", size: "text-4xl", delay: "0s", duration: "18s" },
  { emoji: "🥦", top: "12%", right: "5%", size: "text-3xl", delay: "2s", duration: "22s" },
  { emoji: "🍋", top: "25%", left: "6%", size: "text-2xl", delay: "4s", duration: "20s" },
  { emoji: "🥬", top: "40%", right: "4%", size: "text-4xl", delay: "1s", duration: "24s" },
  { emoji: "🫑", top: "55%", left: "2%", size: "text-3xl", delay: "3s", duration: "19s" },
  { emoji: "🍃", top: "68%", right: "6%", size: "text-2xl", delay: "5s", duration: "21s" },
  { emoji: "🥒", top: "78%", left: "5%", size: "text-3xl", delay: "2s", duration: "23s" },
  { emoji: "🌿", top: "85%", right: "3%", size: "text-2xl", delay: "4s", duration: "17s" },
];

export default function LaunchPartyCTA() {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[#0a1f0a] via-[#0d2b0d] to-[#0a1a0a]">
      {/* Organic green glow spots */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#449531]/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#3d6b2a]/8 rounded-full blur-[140px]" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-[#449531]/6 rounded-full blur-[100px]" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(117,246,99,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(117,246,99,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating food items */}
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

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Event header card */}
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 sm:p-12 shadow-2xl shadow-[#449531]/5">
          {/* Event badge */}
          <div className="inline-flex items-center gap-2 bg-[#3d6b2a]/10 border border-[#75F663]/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-[#3d6b2a] rounded-full animate-pulse" />
            <span className="text-sm text-[#75F663] font-medium">
              Free Event — Limited to 100 Guests
            </span>
          </div>

          {/* Two-line title */}
          <h1 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight mb-2">
            Mad Fresh
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#75F663] to-[#449531] bg-clip-text text-transparent mb-6">
            App Launch Party
          </h2>

          {/* Event details grid */}
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
              <Calendar size={18} className="text-[#75F663]" />
              <span className="text-[#4a5e3a] text-sm">Thursday, May 28, 2026</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
              <Clock size={18} className="text-[#75F663]" />
              <span className="text-[#4a5e3a] text-sm">7:00 PM – 9:00 PM MST</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
              <MapPin size={18} className="text-[#75F663]" />
              <span className="text-[#4a5e3a] text-sm">455 S 48th St, Tempe, AZ</span>
            </div>
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
              <Users size={18} className="text-[#75F663]" />
              <span className="text-[#4a5e3a] text-sm">100 spots available</span>
            </div>
          </div>

          {/* Description */}
          <div className="text-[#7a7060] leading-relaxed max-w-2xl text-sm sm:text-base space-y-3 mb-8">
            <p>
              After 8 years feeding the Valley, <strong className="text-[#1e2d18] font-semibold">Mad Fresh is going digital</strong> — and you get to be in the room when it happens.
            </p>
            <p>
              Be the <em className="text-[#75F663] not-italic font-medium">first to access the app</em>, lock in{" "}
              <strong className="text-[#1e2d18] font-semibold">founding member pricing that never goes up</strong>, and taste the bowls that keep your week on track so you never{" "}
              <em className="italic">go mad</em> without your Mad Fresh meals again.
            </p>
            <p className="text-[#4a5e3a] font-medium">
              Amazing food. Powerful connections.{" "}
              <span className="text-[#75F663]">Limited to 100</span> — once it&apos;s full, it&apos;s full.
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href="/events/app-launch-party-2026"
            className="inline-block font-bold py-4 px-8 sm:px-10 rounded-full text-lg transition-all bg-gradient-to-r from-[#449531] to-[#75F663] text-[#0a1f0a] hover:shadow-lg hover:shadow-[#449531]/25 active:scale-[0.99]"
          >
            RSVP Free — Limited Spots
          </Link>
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes floatFood {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-20px) rotate(4deg); }
        }
      `}</style>
    </section>
  );
}
