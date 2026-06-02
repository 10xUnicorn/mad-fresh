import Link from "next/link";
import { Heart } from "lucide-react";

export default function ImpactSection() {
  return (
    <section id="impact" className="py-20 bg-[#f2efe8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Left: Story */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white border border-[#ddd8cc] rounded-full px-4 py-2">
              <Heart size={14} className="text-[#dc2626]" />
              <span className="text-xs font-bold text-[#7a7060] tracking-wide">Community Impact</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18] leading-tight tracking-tight">
              Every bowl you buy<br />
              <span className="text-[#3d6b2a]">feeds someone who needs it.</span>
            </h2>
            <p className="text-[#7a7060] leading-relaxed">
              Mad Fresh Kitchen was built on a simple belief: good food should be for everyone. With every order, a portion goes directly to preparing meals for people experiencing homelessness in the Phoenix metro area.
            </p>
            <p className="text-[#7a7060] leading-relaxed">
              You choose how much to give — or round up your order. We handle the rest. Real meals, prepared in our kitchen, delivered with dignity. Not a marketing stunt. A mission.
            </p>

            {/* Impact stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#3d6b2a]">500+</p>
                <p className="text-xs text-[#7a7060] mt-1 font-medium">Meals Donated</p>
              </div>
              <div className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#3d6b2a]">Local</p>
                <p className="text-xs text-[#7a7060] mt-1 font-medium">Phoenix Metro</p>
              </div>
              <div className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#3d6b2a]">100%</p>
                <p className="text-xs text-[#7a7060] mt-1 font-medium">From Our Kitchen</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/menu"
                className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold px-6 py-3.5 rounded-full text-center transition-colors text-sm"
              >
                Order & Start Giving
              </Link>
              <Link
                href="/donate"
                className="border border-[#ddd8cc] hover:border-[#3d6b2a] text-[#4a5e3a] font-semibold px-6 py-3.5 rounded-full text-center hover:bg-white transition-all text-sm"
              >
                Donate a Meal
              </Link>
            </div>
          </div>

          {/* Right: visual */}
          <div className="relative">
            <div className="bg-white border border-[#ddd8cc] rounded-3xl p-8 shadow-sm">
              <div className="aspect-video bg-[#e9f0e4] rounded-2xl overflow-hidden mb-6">
                <img
                  src="/images/brand/hero-banner.png"
                  alt="Mad Fresh Kitchen community impact"
                  className="w-full h-full object-cover"
                />
              </div>
              <blockquote className="text-[#4a5e3a] italic text-base leading-relaxed">
                &ldquo;Mad Fresh is more than what&apos;s on the plate. It&apos;s about showing up for yourself — and for your community.&rdquo;
              </blockquote>
              <p className="text-sm font-bold text-[#3d6b2a] mt-3">— Ty &amp; Blanca, Founders</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
