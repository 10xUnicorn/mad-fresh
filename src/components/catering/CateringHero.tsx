"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// Deterministic particle positions (no Math.random = no hydration mismatch)
const PARTICLES = [
  { top: 12, left: 8, duration: 7, delay: 0.2 },
  { top: 85, left: 92, duration: 9, delay: 1.1 },
  { top: 34, left: 45, duration: 11, delay: 2.5 },
  { top: 67, left: 23, duration: 8, delay: 0.7 },
  { top: 91, left: 56, duration: 10, delay: 3.2 },
  { top: 5, left: 78, duration: 13, delay: 1.8 },
  { top: 48, left: 15, duration: 7, delay: 4.0 },
  { top: 22, left: 88, duration: 9, delay: 0.5 },
  { top: 73, left: 42, duration: 12, delay: 2.1 },
  { top: 56, left: 67, duration: 8, delay: 3.7 },
  { top: 15, left: 33, duration: 10, delay: 1.4 },
  { top: 82, left: 71, duration: 11, delay: 4.5 },
  { top: 39, left: 5, duration: 9, delay: 0.9 },
  { top: 61, left: 95, duration: 7, delay: 2.8 },
  { top: 8, left: 52, duration: 13, delay: 3.5 },
  { top: 95, left: 18, duration: 8, delay: 1.6 },
  { top: 28, left: 73, duration: 10, delay: 4.2 },
  { top: 44, left: 38, duration: 12, delay: 0.3 },
  { top: 77, left: 85, duration: 9, delay: 2.4 },
  { top: 53, left: 11, duration: 11, delay: 3.9 },
];

export default function CateringHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToForm = () => {
    const formElement = document.getElementById("catering-form");
    formElement?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated green gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #0d1f0a 25%, #0a2a0a 50%, #0d1f0a 75%, #0a0a0a 100%)",
          backgroundSize: "400% 400%",
          animation: mounted ? "catering-gradient-shift 12s ease infinite" : undefined,
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#75F663]/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#449531]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3d6b2a]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />

      {/* Particle-like dots — deterministic positions */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#75F663]/20 rounded-full"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              animation: mounted ? `catering-float ${p.duration}s ease-in-out infinite` : undefined,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <p className="text-sm font-semibold text-[#75F663] uppercase tracking-widest">
          Fresh · Chef-Crafted · Valley-Wide
        </p>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
          Catering with <span className="text-[#75F663]">Flavor &amp; Quality</span>
        </h1>

        <p className="text-xl sm:text-2xl text-[#4a5e3a] max-w-2xl mx-auto leading-relaxed">
          Food accessible for every table &mdash; fueling busy teams, inspired events, and everyday moments with meals that feel as good as they taste. Corporate or Private &mdash; we&apos;ve got you covered.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 bg-[#75F663] hover:bg-[#75F663]/90 text-[#0a0a0a] font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-[#75F663]/20"
          >
            Get a Free Quote
            <ChevronDown size={20} />
          </button>
          <button
            onClick={() => document.getElementById("volume-calculator")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition border border-white/10"
          >
            Calculate Volume Pricing
          </button>
        </div>
      </div>

      {/* CSS Animations — using standard style tag instead of styled-jsx */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes catering-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes catering-float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.3; }
          75% { transform: translateY(-30px) translateX(15px); opacity: 0.4; }
        }
      `}} />
    </section>
  );
}
