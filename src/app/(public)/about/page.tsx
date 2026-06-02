import { Metadata } from "next";
import { Award, Heart, Leaf, Users, ChefHat, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Mad Fresh Kitchen",
  description:
    "Arizona's cleanest meal prep service since 2018. Family-owned by Ty & Blanca. Award-winning flavor, organic ingredients, no seed oils.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#faf8f3] min-h-screen">

      {/* Hero */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e9f0e4] rounded-full blur-3xl opacity-70 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <Image src="/images/brand/mad-fresh-logo.png" alt="Mad Fresh Kitchen" width={80} height={80}
              className="w-20 h-20 object-contain rounded-2xl shadow-md" />
          </div>
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-4">Our Story</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1e2d18] leading-tight tracking-tight mb-6">
            Real Food. Rooted in Purpose.<br />
            <span className="text-[#3d6b2a]">Made with Love.</span>
          </h1>
          <p className="text-[#7a7060] text-lg max-w-2xl mx-auto leading-relaxed">
            From a home kitchen in Tempe to serving PayPal, GoDaddy, and the Arizona Rattlers — 
            built by a husband-and-wife team who asked one question before every dish.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white border-y border-[#ddd8cc]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 text-[#4a5e3a] text-lg leading-relaxed">
            <p>
              Mad Fresh Kitchen was born from a simple but powerful mission: to feed our family — and eventually, our community — real, nourishing food without compromise.
            </p>
            <p>
              Founded in 2018 by husband-and-wife duo <strong className="text-[#1e2d18]">Ty</strong> and <strong className="text-[#1e2d18]">Blanca</strong>, Mad Fresh combines culinary passion with a deep understanding of health and wellness. Blanca brings her chef background, family recipes, and love for the kitchen to every dish we serve. Ty, a certified nutritionist and performance athlete coach, holds a degree in Health &amp; Wellness from Arizona State and brings the science of clean eating into every meal.
            </p>
            <p>
              Together, we&apos;ve built something more than just a meal prep company. We&apos;ve created a kitchen that fuels busy families, driven professionals, and elite athletes — all while using fresh, organic ingredients, no shortcuts, and bold, unforgettable flavors.
            </p>
            <p>
              Our meals are handcrafted weekly with intention and integrity — from build-your-own bowls and vibrant salads to large-scale catering and athlete fueling programs. Everything we make starts with the question: <em className="text-[#3d6b2a] font-semibold">Would we feed this to our own family?</em> If the answer isn&apos;t a firm yes, it doesn&apos;t make the cut.
            </p>
            <p className="text-[#3d6b2a] font-semibold text-xl">
              Thanks for letting us Fuel your Journey.
            </p>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] text-center mb-3">The Team</p>
          <h2 className="text-3xl font-black text-[#1e2d18] text-center mb-12">Meet the Founders</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-[#e9f0e4] rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={36} className="text-[#3d6b2a]" />
              </div>
              <h3 className="text-xl font-bold text-[#1e2d18] mb-1">Ty</h3>
              <p className="text-[#3d6b2a] text-sm font-semibold mb-4">Co-Founder &amp; Nutrition Lead</p>
              <p className="text-[#7a7060] text-sm leading-relaxed">
                Certified nutritionist and performance athlete coach with a degree in Health &amp; Wellness from Arizona State University. Ty brings the science of clean eating into every meal, ensuring each bowl is macro-balanced and built to fuel performance.
              </p>
            </div>
            <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-[#e9f0e4] rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat size={36} className="text-[#3d6b2a]" />
              </div>
              <h3 className="text-xl font-bold text-[#1e2d18] mb-1">Blanca</h3>
              <p className="text-[#3d6b2a] text-sm font-semibold mb-4">Co-Founder &amp; Head Chef</p>
              <p className="text-[#7a7060] text-sm leading-relaxed">
                With a professional chef background and treasured family recipes, Blanca is the creative force behind every Mad Fresh dish. Her love for the kitchen and commitment to bold, unforgettable flavors is what makes every meal special.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#f2efe8] border-y border-[#ddd8cc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] text-center mb-3">Our Values</p>
          <h2 className="text-3xl font-black text-[#1e2d18] text-center mb-12">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Leaf, title: "Clean Ingredients", desc: "Organic, Non-GMO, Gluten-Free, Low-Sodium. No seed oils. No shortcuts, ever." },
              { icon: Heart, title: "Family First", desc: "If we wouldn't feed it to our own family, it doesn't make the cut." },
              { icon: Award, title: "Award Winning", desc: "Best of the Valley 2023 & 2025. Recognized for flavor and quality." },
              { icon: Users, title: "Community Driven", desc: "Every bowl sold helps feed someone in need across the Phoenix metro area." },
            ].map((v) => (
              <div key={v.title} className="bg-white border border-[#ddd8cc] rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#e9f0e4] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <v.icon size={24} className="text-[#3d6b2a]" />
                </div>
                <h3 className="text-[#1e2d18] font-bold mb-2">{v.title}</h3>
                <p className="text-[#7a7060] text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Partners */}
      <section className="py-16 bg-white border-b border-[#ddd8cc]" id="awards">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] text-center mb-3">Recognition</p>
          <h2 className="text-3xl font-black text-[#1e2d18] text-center mb-4">Trusted Across Arizona</h2>
          <p className="text-[#7a7060] text-center mb-10 max-w-xl mx-auto">
            We&apos;re proud to be recognized as Best of the Valley in both 2023 and 2025, and trusted by some of Arizona&apos;s most recognized organizations.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["PayPal","GoDaddy","Amazon","Trainual","PHI","Arizona Rattlers","Dream City Christian","Legendary Prep","Iron Prep"].map((name) => (
              <span key={name} className="bg-[#f2efe8] border border-[#ddd8cc] text-[#4a5e3a] text-sm font-semibold px-4 py-2 rounded-full">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Franchise */}
      <section className="py-16 bg-[#1e2d18]" id="franchise">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-[#75F663] uppercase tracking-[.12em] mb-3">Franchise Opportunities</p>
          <h2 className="text-3xl font-black text-white mb-4">We&apos;re Not Just a Meal Prep Company.</h2>
          <p className="text-[rgba(255,255,255,.65)] mb-4 leading-relaxed">
            Mad Fresh has built multiple revenue streams across retail, delivery, catering, corporate, schools, athlete programs, and events. A future franchisee isn&apos;t buying a meal prep business — they&apos;re buying a <strong className="text-white">diversified food service model</strong>.
          </p>
          <p className="text-[rgba(255,255,255,.5)] text-sm mb-8">Interested in bringing Mad Fresh to your market? Reach out to start the conversation.</p>
          <a href="mailto:Order@EatMadFresh.com?subject=Franchise Inquiry"
            className="inline-flex items-center gap-2 bg-[#75F663] hover:bg-[#5aaa3c] text-[#0d2209] font-black px-8 py-4 rounded-full transition-colors">
            Inquire About Franchising →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#faf8f3]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-[#1e2d18] mb-4">Ready to eat better?</h2>
          <p className="text-[#7a7060] mb-8">Order by Friday at noon for Sunday delivery, or pick up same-day at our Tempe kitchen.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu" className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold px-8 py-3.5 rounded-full text-center transition-colors">
              View the Menu
            </Link>
            <Link href="/catering#quote" className="bg-white border border-[#ddd8cc] hover:border-[#3d6b2a] text-[#1e2d18] font-semibold px-8 py-3.5 rounded-full text-center transition-all">
              Catering Inquiry
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
