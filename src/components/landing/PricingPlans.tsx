"use client";

import Link from "next/link";
import { Check, Star, Mail } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    meals: 5,
    weeklyPrice: 79,
    perMeal: "15.80",
    monthlyPrice: 299,
    annualPrice: 3497,
    popular: false,
    features: [
      "5 meals per week",
      "Full menu access",
      "Customize by Wednesday",
      "Weekly delivery or pickup",
      "Nutrition labels included",
    ],
  },
  {
    name: "Performance",
    meals: 10,
    weeklyPrice: 139,
    perMeal: "13.90",
    monthlyPrice: 527,
    annualPrice: 5997,
    popular: true,
    features: [
      "10 meals per week",
      "Full menu access",
      "Customize by Wednesday",
      "Priority delivery scheduling",
      "Nutrition labels included",
      "Free weekly add-on swap",
    ],
  },
  {
    name: "Elite",
    meals: 15,
    weeklyPrice: 189,
    perMeal: "12.60",
    monthlyPrice: 717,
    annualPrice: 8497,
    popular: false,
    features: [
      "15 meals per week",
      "Full menu access",
      "Customize by Wednesday",
      "Priority delivery scheduling",
      "Nutrition labels included",
      "2 free weekly add-on swaps",
      "Founding member pricing lock",
    ],
  },
];

export default function PricingPlans() {
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim()) {
      setUnlocked(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("mfk_email", email);
      }
    }
  };

  return (
    <section id="plans" className="py-24 bg-[#faf8f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#3d6b2a] uppercase tracking-widest mb-3">
            Meal Plans
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight">
            Subscribe & save up to 20%
          </h2>
          <p className="text-[#7a7060] mt-4">
            Lock in founding member pricing. Cancel or pause anytime. Customize
            your bowls every week before Wednesday at midnight.
          </p>
        </div>

        {/* Email unlock section */}
        {!unlocked && (
          <div className="max-w-md mx-auto mb-12">
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-white border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a] focus:border-[#3d6b2a] transition"
              />
              <button
                type="submit"
                className="bg-[#3d6b2a] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#5aaa3c] transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Mail size={18} />
                Unlock Pricing
              </button>
            </form>
            <p className="text-center text-sm text-[#9a9080] mt-3">
              Enter your email to see pricing
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.popular
                  ? "bg-white text-white ring-2 ring-[#75F663] scale-[1.02]"
                  : "bg-white text-[#1e2d18] border border-[#ddd8cc] shadow-[0_2px_8px_rgba(30,45,24,.06)]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#75F663] text-[#161616] text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} /> Most Popular
                </div>
              )}

              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p
                className={`text-sm mb-6 ${
                  plan.popular ? "text-[#7a7060]" : "text-[#7a7060]"
                }`}
              >
                {plan.meals} meals / week
              </p>

              <div className="mb-6">
                <span
                  className={`text-4xl font-black ${
                    !unlocked ? "filter blur-md select-none" : ""
                  }`}
                >
                  ${plan.weeklyPrice}
                </span>
                <span
                  className={`text-sm ${
                    plan.popular ? "text-[#7a7060]" : "text-[#7a7060]"
                  }`}
                >
                  /week
                </span>
                <p
                  className={`text-xs mt-1 ${
                    plan.popular ? "text-[#9a9080]" : "text-[#9a9080]"
                  } ${!unlocked ? "filter blur-md select-none" : ""}`}
                >
                  ${plan.perMeal} per meal
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${
                        plan.popular ? "text-[#75F663]" : "text-[#3d6b2a]"
                      }`}
                    />
                    <span
                      className={plan.popular ? "text-[#4a5e3a]" : "text-[#7a7060]"}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/waitlist"
                className={`block text-center font-semibold py-3 rounded-full transition ${
                  plan.popular
                    ? "btn-primary"
                    : "border border-[#3d6b2a] text-[#3d6b2a] hover:bg-[#3d6b2a] hover:text-white"
                }`}
              >
                Join Waitlist
              </Link>
            </div>
          ))}
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-[#9a9080] mt-8">
          All plans billed weekly. Monthly &amp; annual billing available at
          checkout. Founding member pricing guaranteed for life.
        </p>
      </div>
    </section>
  );
}
