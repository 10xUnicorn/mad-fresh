import Link from "next/link";
import { Heart, Handshake, Leaf, Users } from "lucide-react";

export default function DonationsPage() {
  return (
    <main className="min-h-screen bg-[#faf8f3]">

      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#e9f0e4] rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#fff8ee] border border-[#f0ddb8] rounded-full px-4 py-2">
            <Heart size={14} className="text-[#dc2626]" />
            <span className="text-xs font-bold text-[#b45309]">Community Impact</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-[#1e2d18] tracking-tight">Our Impact</h1>
          <p className="text-xl text-[#7a7060] max-w-2xl mx-auto leading-relaxed">
            Every meal fuels more than just your day. Mad Fresh is committed to feeding the community and reducing food waste.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-[#ddd8cc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: "500+", label: "Meals Donated" },
              { num: "50+", label: "Community Events" },
              { num: "8", label: "Years Serving the Valley" },
            ].map((s) => (
              <div key={s.label} className="bg-[#f2efe8] border border-[#ddd8cc] rounded-2xl p-8 text-center">
                <p className="text-5xl font-black text-[#3d6b2a]">{s.num}</p>
                <p className="text-[#7a7060] font-semibold mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Give Back */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center">
            <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-3">How We Give Back</p>
            <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18]">Food Is Our Love Language</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Community Meal Program", desc: "A portion of every order goes directly to preparing fresh meals for people experiencing homelessness in the Phoenix metro area. Real meals, prepared in our kitchen, delivered with dignity." },
              { icon: Leaf, title: "Zero Waste Kitchen", desc: "We partner with local organizations to repurpose food that would otherwise go to waste, turning surplus into nourishment for those who need it most." },
              { icon: Handshake, title: "Local Sourcing", desc: "By sourcing ingredients from local Arizona farms and producers, we reduce our environmental footprint while keeping money in the community." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-[#ddd8cc] rounded-2xl p-8 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#e9f0e4] rounded-lg flex items-center justify-center mb-5">
                  <item.icon size={24} className="text-[#3d6b2a]" />
                </div>
                <h3 className="text-xl font-bold text-[#1e2d18] mb-3">{item.title}</h3>
                <p className="text-[#7a7060] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1e2d18]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Order a Meal. Feed Two.</h2>
          <p className="text-[rgba(255,255,255,.6)] mb-8">Every order you place helps fund a meal for someone in our community. Round up at checkout or donate directly.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu" className="bg-[#75F663] hover:bg-[#5aaa3c] text-[#0d2209] font-black px-8 py-4 rounded-full transition-colors">
              Order Now
            </Link>
            <Link href="/menu" className="border border-[rgba(255,255,255,.2)] text-white font-semibold px-8 py-4 rounded-full hover:border-[rgba(255,255,255,.4)] transition-all">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
