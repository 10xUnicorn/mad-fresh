"use client";

import Link from "next/link";
import Image from "next/image";
import { Award } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#faf8f3] overflow-hidden pt-[70px]">
      {/* Soft organic bg blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#e9f0e4] rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#f2efe8] rounded-full blur-3xl opacity-80 -translate-x-1/4 translate-y-1/4 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT: Copy */}
          <div className="space-y-8">

            {/* Award badge */}
            <div className="inline-flex items-center gap-2 bg-[#fff8ee] border border-[#f0ddb8] rounded-full px-4 py-2">
              <Award size={14} className="text-[#b45309] flex-shrink-0" />
              <span className="text-xs font-bold text-[#b45309] tracking-wide">
                Best of the Valley 2023 &amp; 2025 — Tempe, Arizona
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1e2d18] leading-[1.04] tracking-tight">
                Fueling Arizona
                <br />
                <span className="text-[#3d6b2a]">Since 2018.</span>
              </h1>
              <p className="text-base sm:text-lg font-semibold text-[#4a5e3a] tracking-wide">
                Meal Prep &nbsp;·&nbsp; Corporate Catering &nbsp;·&nbsp; Food Service Programs
              </p>
            </div>

            {/* Sub-copy */}
            <p className="text-base sm:text-lg text-[#7a7060] max-w-lg leading-relaxed">
              From individual meal plans to daily lunch programs serving schools, athletes, and
              corporate teams across Arizona. Organic. No seed oils. Made with love by Ty &amp; Blanca.
            </p>

            {/* 3 CTAs */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                href="/menu"
                className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold px-7 py-4 rounded-full text-center inline-flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
              >
                🥗 Order Meal Prep
              </Link>
              <Link
                href="/catering#quote"
                className="bg-white border border-[#ddd8cc] hover:border-[#3d6b2a] hover:bg-[#f2efe8] text-[#1e2d18] font-semibold px-7 py-4 rounded-full text-center inline-flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
              >
                🏢 Request Catering
              </Link>
              <Link
                href="/#food-programs"
                className="bg-[#fff8ee] border border-[#f0ddb8] hover:bg-[#fdf0d5] text-[#7a5c2a] font-semibold px-7 py-4 rounded-full text-center inline-flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
              >
                🏫 Food Programs
              </Link>
            </div>

            {/* Micro-stats */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#3d6b2a]">4.6★</span>
                <span className="text-sm text-[#7a7060]">105 Google reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#3d6b2a]">2018</span>
                <span className="text-sm text-[#7a7060]">Family-owned since</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#3d6b2a]">50+</span>
                <span className="text-sm text-[#7a7060]">Corporate clients</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Food photo grid */}
          <div className="hidden lg:block relative">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="aspect-square overflow-hidden rounded-2xl bg-[#e9f0e4]">
                  <img src="/images/menu/chipotle-crema-bowl.png" alt="Chipotle Crema Bowl"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#f2efe8]">
                  <img src="/images/menu/screenshot-2026-04-01-at-4.26.40-pm.png" alt="Fresh meal prep"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="space-y-3 mt-6">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#f2efe8]">
                  <img src="/images/catering/catering-spread.jpg" alt="Catering spread"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="aspect-square overflow-hidden rounded-2xl bg-[#e9f0e4]">
                  <img src="/images/menu/flank-steak-43c463c.jpeg" alt="Flank steak bowl"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-[#ddd8cc] rounded-2xl px-5 py-4 shadow-md">
              <div className="flex items-center gap-3">
                <Image src="/images/brand/mad-fresh-logo.png" alt="Mad Fresh" width={36} height={36}
                  className="w-9 h-9 rounded-lg object-contain" />
                <div>
                  <p className="text-xs font-bold text-[#3d6b2a]">ORDER BY FRIDAY NOON</p>
                  <p className="text-xs text-[#7a7060] mt-0.5">Delivered every Sunday Valleywide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
