"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const PRESETS = {
  office: { name: "Office Team", people: 20, daysPerWeek: 5, mealsPerDay: 1 },
  gym: { name: "Gym/Studio", people: 50, daysPerWeek: 5, mealsPerDay: 2 },
  school: { name: "School/Camp", people: 100, daysPerWeek: 5, mealsPerDay: 2 },
  event: { name: "Corporate Event", people: 150, daysPerWeek: 1, mealsPerDay: 1 },
};

const DEFAULT_PRICE_TIERS = [
  { min_quantity: 1, max_quantity: 9, price_per_unit: 14.99, discount_percent: 0, label: "Individual" },
  { min_quantity: 10, max_quantity: 24, price_per_unit: 13.49, discount_percent: 10, label: "Small Group" },
  { min_quantity: 25, max_quantity: 49, price_per_unit: 12.74, discount_percent: 15, label: "Team" },
  { min_quantity: 50, max_quantity: 99, price_per_unit: 11.99, discount_percent: 20, label: "Department" },
  { min_quantity: 100, max_quantity: 199, price_per_unit: 10.49, discount_percent: 30, label: "Company" },
  { min_quantity: 200, max_quantity: null, price_per_unit: 8.99, discount_percent: 40, label: "Enterprise" },
];

const BASE_PRICE = 14.99;

export interface PriceTier {
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
  discount_percent: number;
  label: string;
}

interface Props {
  tiers?: PriceTier[];
}

export default function VolumeDiscountCalculator({ tiers = DEFAULT_PRICE_TIERS }: Props) {
  const [people, setPeople] = useState(20);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [mealsPerDay, setMealsPerDay] = useState(1);
  const [activePreset, setActivePreset] = useState<string>("office");
  const [displayPrice, setDisplayPrice] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);
  const animRef = useRef({ price: 0, total: 0 });

  // Calculate meals and pricing
  const totalMeals = people * daysPerWeek * mealsPerDay;

  const priceTier = tiers.find(
    (tier) => totalMeals >= tier.min_quantity && (tier.max_quantity === null || totalMeals <= tier.max_quantity)
  ) || tiers[0];

  const perMealPrice = priceTier.price_per_unit;
  const totalPrice = totalMeals * perMealPrice;
  const savings = totalMeals * (BASE_PRICE - perMealPrice);

  // Animate price changes — uses refs to track animation start values
  useEffect(() => {
    let animationFrameId: number;
    const startPrice = animRef.current.price;
    const startTotal = animRef.current.total;
    const targetPrice = perMealPrice;
    const targetTotal = totalPrice;
    const totalFrames = 20;
    let frame = 0;

    const animate = () => {
      frame++;
      const progress = Math.min(frame / totalFrames, 1);
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentPrice = startPrice + (targetPrice - startPrice) * eased;
      const currentTotal = startTotal + (targetTotal - startTotal) * eased;

      animRef.current.price = currentPrice;
      animRef.current.total = currentTotal;
      setDisplayPrice(currentPrice);
      setDisplayTotal(currentTotal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Ensure we land exactly on target
        animRef.current.price = targetPrice;
        animRef.current.total = targetTotal;
        setDisplayPrice(targetPrice);
        setDisplayTotal(targetTotal);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [perMealPrice, totalPrice]);

  const handlePresetClick = (presetKey: string) => {
    if (presetKey === "custom") {
      setActivePreset("custom");
    } else {
      const preset = PRESETS[presetKey as keyof typeof PRESETS];
      if (preset) {
        setPeople(preset.people);
        setDaysPerWeek(preset.daysPerWeek);
        setMealsPerDay(preset.mealsPerDay);
        setActivePreset(presetKey);
      }
    }
  };

  return (
    <section className="py-16 bg-[#faf8f3] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-[#75F663]/5 rounded-full blur-3xl" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#449531]/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#75F663] uppercase tracking-widest mb-2">
            Bulk Ordering
          </p>
          <h2 className="text-3xl sm:text-3xl lg:text-3xl font-black text-white tracking-tight leading-tight mb-3">
            Volume Discounts
          </h2>
          <p className="text-sm text-[#7a7060] max-w-2xl mx-auto">
            The more you order, the more you save. See your instant pricing as
            you customize your group size.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Preset Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                Quick Presets
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetClick(key)}
                    className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all duration-300 ${
                      activePreset === key
                        ? "bg-[#75F663] text-[#0a0a0a] shadow-lg shadow-[#75F663]/30 scale-105"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
                <button
                  onClick={() => handlePresetClick("custom")}
                  className={`px-3 py-1.5 rounded-full font-semibold text-xs transition-all duration-300 col-span-2 ${
                    activePreset === "custom"
                      ? "bg-[#75F663] text-[#0a0a0a] shadow-lg shadow-[#75F663]/30 scale-105"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              {/* People Slider */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs font-semibold text-white">
                    Number of People
                  </label>
                  <span className="text-lg font-black text-[#75F663]">
                    {people}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={people}
                  onChange={(e) => {
                    setPeople(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#75F663]"
                  style={{
                    background: `linear-gradient(to right, #75F663 0%, #75F663 ${
                      (people / 200) * 100
                    }%, rgba(255,255,255,0.1) ${(people / 200) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-[#9a9080] mt-2">
                  <span>1</span>
                  <span>200</span>
                </div>
              </div>

              {/* Days Per Week Slider */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs font-semibold text-white">
                    Days Per Week
                  </label>
                  <span className="text-lg font-black text-[#75F663]">
                    {daysPerWeek}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={daysPerWeek}
                  onChange={(e) => {
                    setDaysPerWeek(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#75F663]"
                  style={{
                    background: `linear-gradient(to right, #75F663 0%, #75F663 ${
                      (daysPerWeek / 7) * 100
                    }%, rgba(255,255,255,0.1) ${(daysPerWeek / 7) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-[#9a9080] mt-2">
                  <span>1</span>
                  <span>7</span>
                </div>
              </div>

              {/* Meals Per Day Slider */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs font-semibold text-white">
                    Meals Per Person Per Day
                  </label>
                  <span className="text-lg font-black text-[#75F663]">
                    {mealsPerDay}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={mealsPerDay}
                  onChange={(e) => {
                    setMealsPerDay(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#75F663]"
                  style={{
                    background: `linear-gradient(to right, #75F663 0%, #75F663 ${
                      (mealsPerDay / 3) * 100
                    }%, rgba(255,255,255,0.1) ${(mealsPerDay / 3) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-[#9a9080] mt-2">
                  <span>1</span>
                  <span>3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Pricing Display */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] rounded-3xl p-5 border border-[#75F663]/20 sticky top-24">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
              <div>
                <p className="text-xs text-[#7a7060] mb-1">Total Meals</p>
                <p className="text-2xl font-black text-white">
                  {totalMeals.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9a9080] mb-1 uppercase tracking-widest">
                  Price Tier
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#75F663]">
                    {priceTier.discount_percent}%
                  </span>
                  <span className="text-xs text-[#7a7060]">off</span>
                </div>
              </div>
            </div>

            {/* Price Row */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
              <div>
                <p className="text-xs text-[#7a7060] mb-1">Per-Meal Price</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">
                    ${displayPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#9a9080] line-through">
                    ${BASE_PRICE.toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#7a7060] mb-1">Total Price</p>
                <p className="text-2xl font-black text-white tabular-nums">
                  ${displayTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Savings */}
            <div className="bg-[#75F663]/10 border border-[#75F663]/30 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#75F663] uppercase tracking-widest font-semibold">
                    You Save
                  </p>
                  <p className="text-xl font-black text-[#75F663]">
                    ${savings.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-[#7a7060]">
                  vs. base price ({priceTier.discount_percent}% discount)
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/catering"
              className="w-full bg-[#75F663] hover:bg-[#75F663]/90 text-[#0a0a0a] font-bold px-5 py-3 rounded-full text-sm transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg shadow-[#75F663]/30 active:scale-95 mb-4"
            >
              Get a Custom Quote
              <ChevronRight size={16} />
            </Link>

            {/* Pricing Breakdown - Compact Grid */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">
                Pricing Breakdown
              </p>
              <div className="grid grid-cols-2 gap-2">
                {tiers.map((tier) => (
                  <div
                    key={`${tier.min_quantity}-${tier.max_quantity}`}
                    className={`rounded-lg px-3 py-2 transition-colors ${
                      totalMeals >= tier.min_quantity && (tier.max_quantity === null || totalMeals <= tier.max_quantity)
                        ? "bg-[#75F663]/10 border border-[#75F663]/30"
                        : "bg-white/5 border border-white/5"
                    }`}
                  >
                    <p className="text-[10px] text-[#9a9080] leading-tight mb-1">
                      {tier.label}
                    </p>
                    <p className="text-[10px] text-[#9a9080] leading-tight">
                      {tier.min_quantity.toLocaleString()}{" "}
                      {tier.max_quantity === null ? "+" : `–${tier.max_quantity.toLocaleString()}`} meals
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-white">
                        ${tier.price_per_unit.toFixed(2)}
                      </span>
                      {tier.discount_percent > 0 && (
                        <span className="text-[10px] text-[#75F663] font-bold">
                          {tier.discount_percent}% off
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-[#9a9080] text-center mt-3">
              Volume discounts apply to single orders. Contact us for
              subscription pricing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
