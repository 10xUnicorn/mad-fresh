import Link from "next/link";
import Image from "next/image";
import { Star, Zap, RefreshCw, Trophy } from "lucide-react";

const FEATURES = [
  { icon: Star, text: "Track rewards points & badges" },
  { icon: Zap, text: "One-tap reorder your favorites" },
  { icon: RefreshCw, text: "Manage subscriptions on the go" },
  { icon: Trophy, text: "Level up from Seedling to Legend" },
];

export default function AppSection() {
  return (
    <section id="app" className="py-20 bg-[#1e2d18] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-[#75F663] uppercase tracking-[.12em] mb-3">
                The Mad Fresh App
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Your Kitchen,<br />In Your Pocket.
              </h2>
              <p className="text-[rgba(255,255,255,.65)] leading-relaxed">
                The Mad Fresh app is a tool to make your experience seamless. Order, track, earn rewards, and manage your subscription — all from your phone. The brand comes first. The app makes it effortless.
              </p>
            </div>

            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-[rgba(255,255,255,.75)]">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(117,246,99,.1)] flex items-center justify-center flex-shrink-0">
                    <f.icon size={15} className="text-[#75F663]" />
                  </div>
                  {f.text}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/waitlist"
                className="bg-[#75F663] hover:bg-[#5aaa3c] text-[#0d2209] font-black px-7 py-4 rounded-full text-center transition-colors text-sm"
              >
                Join the App Waitlist
              </Link>
              <Link
                href="/menu"
                className="border border-[rgba(255,255,255,.2)] hover:border-[rgba(255,255,255,.4)] text-white font-semibold px-7 py-4 rounded-full text-center transition-all text-sm"
              >
                Order on the Web
              </Link>
            </div>

            <p className="text-xs text-[rgba(255,255,255,.35)]">
              iOS &amp; Android · Coming soon to the App Store &amp; Google Play
            </p>
          </div>

          {/* Right: phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[280px] sm:w-[300px] bg-[#161c12] rounded-[40px] border-4 border-[rgba(255,255,255,.1)] overflow-hidden shadow-2xl">
                {/* Status bar */}
                <div className="bg-[#161c12] px-6 pt-4 pb-2 flex justify-between items-center">
                  <span className="text-[10px] text-[rgba(255,255,255,.5)] font-semibold">9:41 AM</span>
                  <span className="text-[10px] text-[rgba(255,255,255,.5)]">●●● 5G 🔋</span>
                </div>
                {/* App content preview */}
                <div className="bg-[#0e120c] px-4 pb-6 space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,.06)]">
                    <Image src="/images/brand/mad-fresh-logo.png" alt="Mad Fresh" width={32} height={32} className="w-8 h-8 rounded-lg object-contain" />
                    <span className="text-[10px] font-bold bg-[rgba(117,246,99,.12)] text-[#75F663] px-3 py-1 rounded-full border border-[rgba(117,246,99,.2)]">🌾 Harvest</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Hey, <span className="text-[#75F663]">Ty</span> 👋</p>
                    <p className="text-[10px] text-[rgba(255,255,255,.4)] mt-0.5">Next delivery: Sunday</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[["420","⭐ Pts"],["4🔥","Streak"],["7🏆","Badges"]].map(([val, lbl]) => (
                      <div key={lbl} className="bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.06)] rounded-xl py-3 text-center">
                        <p className="text-sm font-black text-white">{val}</p>
                        <p className="text-[9px] text-[rgba(255,255,255,.4)] mt-0.5">{lbl}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-1 bg-[rgba(255,255,255,.06)] rounded-full overflow-hidden">
                    <div className="h-full w-[46%] bg-gradient-to-r from-[#3d6b2a] to-[#75F663] rounded-full" />
                  </div>
                  <button className="w-full bg-[#75F663] text-[#0d2209] font-black py-3 rounded-full text-xs">
                    🍽 Order Now
                  </button>
                  <div className="bg-[rgba(255,255,255,.03)] border border-[rgba(255,255,255,.06)] rounded-xl p-3">
                    <p className="text-[11px] font-bold text-white">#MF-0042 · Jun 1</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] bg-[rgba(117,246,99,.1)] text-[#75F663] px-2 py-0.5 rounded-full font-bold">Delivered</span>
                      <span className="text-[11px] font-black text-white">$89.00</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute inset-0 -z-10 bg-[#75F663] rounded-full blur-3xl opacity-5 scale-150" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
