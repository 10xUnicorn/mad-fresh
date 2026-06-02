"use client";

import { useState } from "react";
import { Calculator, ChevronRight } from "lucide-react";

export interface ServiceLevel {
  name: string;
  price: number;
  min: number;
}

const DEFAULT_SERVICE_LEVELS: ServiceLevel[] = [
  { name: "Corporate Fuel", price: 15, min: 10 },
  { name: "Event Spread", price: 25, min: 25 },
  { name: "Premium Experience", price: 45, min: 50 },
];

interface Props {
  serviceLevels?: ServiceLevel[];
}

export default function CateringCalculator({ serviceLevels = DEFAULT_SERVICE_LEVELS }: Props) {
  const [guests, setGuests] = useState(50);
  const [mealsPerPerson, setMealsPerPerson] = useState(1);
  const [serviceLevel, setServiceLevel] = useState(1);

  const selected = serviceLevels[serviceLevel];
  const totalMeals = guests * mealsPerPerson;
  const subtotal = totalMeals * selected.price;
  const tax = subtotal * 0.086;
  const total = subtotal + tax;

  // Determine budget range for auto-fill
  const getBudgetRange = (amount: number) => {
    if (amount < 500) return "Under $500";
    if (amount < 1000) return "$500-$1,000";
    if (amount < 2500) return "$1,000-$2,500";
    if (amount < 5000) return "$2,500-$5,000";
    if (amount < 10000) return "$5,000-$10,000";
    return "$10,000+";
  };

  const handleGetQuote = () => {
    // Dispatch custom event with calculator data
    window.dispatchEvent(
      new CustomEvent("catering-calculator-fill", {
        detail: {
          guestCount: String(guests),
          packagePreference: selected.name,
          budgetRange: getBudgetRange(total),
          details: `Estimated via calculator: ${guests} guests × ${mealsPerPerson} meal(s) × ${selected.name} ($${selected.price}/person) = $${total.toFixed(2)} total (incl. tax)`,
        },
      })
    );
    // Scroll to form
    setTimeout(() => {
      document.getElementById("catering-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <section id="volume-calculator" className="py-16 bg-[#faf8f3] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#75F663]/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#75F663]/10 border border-[#75F663]/20 mb-4">
            <Calculator size={14} className="text-[#75F663]" />
            <span className="text-xs font-semibold text-[#75F663] uppercase tracking-widest">Instant Estimate</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Catering Price Calculator</h2>
          <p className="text-sm text-[#7a7060] max-w-xl mx-auto">
            Get an instant estimate for your event. Adjust the sliders and we'll auto-fill your quote request.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Controls */}
          <div className="space-y-6">
            {/* Service Level */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">Service Level</p>
              <div className="grid grid-cols-1 gap-2">
                {serviceLevels.map((level, idx) => (
                  <button
                    key={level.name}
                    onClick={() => {
                      setServiceLevel(idx);
                      if (guests < level.min) setGuests(level.min);
                    }}
                    className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 text-left flex justify-between items-center ${
                      serviceLevel === idx
                        ? "bg-[#75F663] text-[#0a0a0a] shadow-lg shadow-[#75F663]/30"
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    <span>{level.name}</span>
                    <span className={serviceLevel === idx ? "text-[#0a0a0a]/70" : "text-[#9a9080]"}>
                      ${level.price}/person · min {level.min}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-semibold text-white">Number of Guests</label>
                <span className="text-lg font-black text-[#75F663]">{guests}</span>
              </div>
              <input
                type="range"
                min={selected.min}
                max="300"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-[#75F663]"
                style={{
                  background: `linear-gradient(to right, #75F663 0%, #75F663 ${((guests - selected.min) / (300 - selected.min)) * 100}%, rgba(255,255,255,0.1) ${((guests - selected.min) / (300 - selected.min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-[#9a9080] mt-2">
                <span>{selected.min}</span>
                <span>300</span>
              </div>
            </div>

            {/* Meals Per Person */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-semibold text-white">Meals Per Person</label>
                <span className="text-lg font-black text-[#75F663]">{mealsPerPerson}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                value={mealsPerPerson}
                onChange={(e) => setMealsPerPerson(Number(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-[#75F663]"
                style={{
                  background: `linear-gradient(to right, #75F663 0%, #75F663 ${((mealsPerPerson - 1) / 2) * 100}%, rgba(255,255,255,0.1) ${((mealsPerPerson - 1) / 2) * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-[#9a9080] mt-2">
                <span>1</span>
                <span>3</span>
              </div>
            </div>
          </div>

          {/* Pricing Display */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] rounded-3xl p-5 border border-[#75F663]/20 sticky top-24">
            <div className="mb-5 pb-5 border-b border-white/10">
              <p className="text-xs text-[#7a7060] mb-1">Service</p>
              <p className="text-xl font-bold text-white">{selected.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-white/10">
              <div>
                <p className="text-xs text-[#7a7060] mb-1">Guests</p>
                <p className="text-2xl font-black text-white">{guests}</p>
              </div>
              <div>
                <p className="text-xs text-[#7a7060] mb-1">Total Meals</p>
                <p className="text-2xl font-black text-white">{totalMeals}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5 pb-5 border-b border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-[#7a7060]">{totalMeals} meals × ${selected.price}</span>
                <span className="text-white font-semibold">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7a7060]">Tax (8.6%)</span>
                <span className="text-white font-semibold">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs text-[#7a7060] mb-1">Estimated Total</p>
              <p className="text-4xl font-black text-[#75F663]">
                ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <button
              onClick={handleGetQuote}
              className="w-full bg-[#75F663] hover:bg-[#75F663]/90 text-[#0a0a0a] font-bold px-5 py-3 rounded-full text-sm transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg shadow-[#75F663]/30 active:scale-95"
            >
              Get Quote with These Details
              <ChevronRight size={16} />
            </button>

            <p className="text-xs text-[#9a9080] text-center mt-3">
              Final pricing may vary based on menu selection and location.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
