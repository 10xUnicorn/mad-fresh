import Image from "next/image";
import Link from "next/link";

export default function OurStory() {
  return (
    <section id="story" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left: photo collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-square bg-[#e9f0e4] rounded-2xl overflow-hidden">
                  <img src="/images/brand/food-containers.png" alt="Mad Fresh meal prep containers"
                    className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/2] bg-[#f2efe8] rounded-2xl overflow-hidden">
                  <img src="/images/menu/screenshot-2026-04-01-at-5.14.45-pm.png" alt="Fresh ingredients"
                    className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="aspect-[3/2] bg-[#f2efe8] rounded-2xl overflow-hidden">
                  <img src="/images/menu/screen-shot-2023-03-14-at-10.03.50-pm.png" alt="Catering event"
                    className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square bg-[#fff8ee] rounded-2xl flex items-center justify-center p-6 border border-[#f0ddb8]">
                  <div className="text-center">
                    <p className="text-4xl font-black text-[#3d6b2a]">2018</p>
                    <p className="text-xs text-[#7a7060] mt-1 font-semibold">Founded in<br />Tempe, AZ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo badge */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white border border-[#ddd8cc] rounded-full p-3 shadow-md">
              <Image src="/images/brand/mad-fresh-logo.png" alt="Mad Fresh Kitchen" width={40} height={40}
                className="w-10 h-10 object-contain rounded-lg" />
            </div>
          </div>

          {/* Right: story copy */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-3">Our Story</p>
              <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18] leading-tight tracking-tight mb-4">
                Real Food. Rooted in Purpose. Made with Love.
              </h2>
            </div>

            <p className="text-[#7a7060] leading-relaxed">
              Mad Fresh Kitchen was born from a simple but powerful mission — to feed our family, and eventually our community, real nourishing food without compromise.
            </p>
            <p className="text-[#7a7060] leading-relaxed">
              Founded in 2018 by husband-and-wife duo <strong className="text-[#1e2d18]">Ty &amp; Blanca</strong>, Mad Fresh combines culinary passion with a deep understanding of health and wellness. Blanca brings her chef background and love for the kitchen to every dish. Ty, a certified nutritionist and performance athlete coach with a degree in Health &amp; Wellness from Arizona State, brings the science of clean eating into every meal.
            </p>
            <p className="text-[#7a7060] leading-relaxed">
              Everything we make starts with the question: <em className="text-[#1e2d18] font-semibold">Would we feed this to our own family?</em> If the answer isn&apos;t a firm yes, it doesn&apos;t make the cut.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-4 bg-[#f2efe8] rounded-xl">
                <p className="text-2xl font-black text-[#3d6b2a]">2×</p>
                <p className="text-xs text-[#7a7060] mt-1 font-medium">Best of the Valley</p>
              </div>
              <div className="text-center p-4 bg-[#f2efe8] rounded-xl">
                <p className="text-2xl font-black text-[#3d6b2a]">4.6★</p>
                <p className="text-xs text-[#7a7060] mt-1 font-medium">Google Rating</p>
              </div>
              <div className="text-center p-4 bg-[#f2efe8] rounded-xl">
                <p className="text-2xl font-black text-[#3d6b2a]">50+</p>
                <p className="text-xs text-[#7a7060] mt-1 font-medium">Corporate Clients</p>
              </div>
            </div>

            <Link href="/about" className="inline-flex items-center gap-2 text-[#3d6b2a] font-bold text-sm hover:underline">
              Learn more about us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
