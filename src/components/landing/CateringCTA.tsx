import Link from "next/link";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "BRONZE",
    price: "$12.95",
    nameColor: "text-[#b45309]",
    items: ["Wraps", "Sandwiches", "Basic Protein Bowls", "1 Chicken Protein", "1 Rice Side", "1 Veggie", "Buffet or Individually Packaged"],
  },
  {
    name: "SILVER",
    price: "$16.95",
    nameColor: "text-[#6b7280]",
    featured: true,
    items: ["2–3 Premium Proteins", "2–3 Premium Sides", "Fresh Veggies", "Signature Sauces", "Buffet or Individually Packaged"],
  },
  {
    name: "GOLD",
    price: "$20.95",
    nameColor: "text-[#b45309]",
    items: ["Steak & Shrimp Options", "Premium Protein Bowls", "Pasta Bars", "Premium Appetizers", "Elevated Sides & Sauces", "Buffet or Individually Packaged"],
  },
];

const WHY = [
  "Organic ingredients & No Seed Oils Ever",
  "Individually packaged or buffet-style",
  "Reliable delivery & professional presentation",
  "Built for offices, events & performance-focused teams",
  "Trusted by PayPal, GoDaddy, Fox Sports & Arizona Rattlers",
];

export default function CateringCTA() {
  return (
    <section id="catering-cta" className="py-20 bg-[#1e2d18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold text-[#75F663] uppercase tracking-[.12em] mb-3">Catering That Fuels Your Team</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            We&apos;ll Bring the Flavor.
          </h2>
          <p className="text-[rgba(255,255,255,.65)] text-base leading-relaxed">
            Organic ingredients. Bold flavor. Built for every budget.
            From office lunches to large-scale corporate events — Mad Fresh handles the food so you can focus on the moment.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-6 border ${
                tier.featured
                  ? "bg-[rgba(117,246,99,.06)] border-[rgba(117,246,99,.25)] ring-1 ring-[rgba(117,246,99,.2)]"
                  : "bg-[rgba(255,255,255,.04)] border-[rgba(255,255,255,.1)]"
              }`}
            >
              {tier.featured && (
                <span className="inline-block bg-[rgba(117,246,99,.15)] text-[#75F663] text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-wide uppercase">
                  Most Popular
                </span>
              )}
              <p className={`text-sm font-black tracking-widest mb-1 ${tier.nameColor}`}>{tier.name}</p>
              <p className="text-3xl font-black text-white mb-1">
                {tier.price}<span className="text-sm font-normal text-[rgba(255,255,255,.5)]">/person</span>
              </p>
              <p className="text-xs text-[rgba(255,255,255,.4)] mb-4">Starting at</p>
              <ul className="space-y-2">
                {tier.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[rgba(255,255,255,.7)]">
                    <Check size={13} className="text-[#75F663] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Why Mad Fresh */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-4">Why Mad Fresh?</p>
            <ul className="space-y-3">
              {WHY.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[rgba(255,255,255,.75)]">
                  <Check size={15} className="text-[#75F663] mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <Link
              href="/catering#quote"
              className="bg-[#75F663] hover:bg-[#5aaa3c] text-[#0d2209] font-black px-8 py-4 rounded-full text-center text-base transition-colors"
            >
              Request a Catering Quote →
            </Link>
            <Link
              href="/catering"
              className="border border-[rgba(255,255,255,.2)] hover:border-[rgba(255,255,255,.4)] text-white font-semibold px-8 py-4 rounded-full text-center text-base transition-all"
            >
              View Full Catering Menu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
