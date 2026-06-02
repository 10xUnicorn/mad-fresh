"use client";

import { Users, Utensils, Crown } from "lucide-react";

interface Package {
  icon: React.ReactNode;
  name: string;
  price: string;
  description: string;
  minimum: string;
  features: string[];
}

const packages: Package[] = [
  {
    icon: <Utensils className="w-8 h-8 text-[#75F663]" />,
    name: "Corporate Fuel",
    price: "$15/person",
    description: "Perfect for team lunches, meetings, and office events",
    minimum: "Minimum 10 guests",
    features: [
      "Individual boxed meals",
      "Includes utensils and napkins",
      "Multiple menu options",
      "Quick turnaround",
    ],
  },
  {
    icon: <Users className="w-8 h-8 text-[#75F663]" />,
    name: "Event Spread",
    price: "$25/person",
    description: "Buffet-style setup for parties and celebrations",
    minimum: "Minimum 25 guests",
    features: [
      "Full buffet with serving equipment",
      "Setup and breakdown included",
      "Multiple stations available",
      "Professional presentation",
    ],
  },
  {
    icon: <Crown className="w-8 h-8 text-[#75F663]" />,
    name: "Premium Experience",
    price: "$45/person",
    description: "White-glove catering with dedicated staff",
    minimum: "Minimum 50 guests",
    features: [
      "Custom menu consultation",
      "Full service: setup, staffing, cleanup",
      "Dedicated event coordinator",
      "Beverage and dessert options",
    ],
  },
];

export default function CateringPackages() {
  return (
    <section className="bg-[#faf8f3] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Catering Packages
          </h2>
          <p className="text-lg text-[#7a7060] max-w-2xl mx-auto">
            Choose the package that fits your event, or mix and match for a
            custom experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className="bg-white border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] transition space-y-6"
            >
              {/* Icon and Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-4">{pkg.icon}</div>
                <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
                <p className="text-3xl font-bold text-[#75F663]">{pkg.price}</p>
                <p className="text-sm text-[#7a7060]">{pkg.minimum}</p>
              </div>

              {/* Description */}
              <p className="text-[#7a7060]">{pkg.description}</p>

              {/* Features */}
              <div className="space-y-3 border-t border-white/[0.06] pt-6">
                {pkg.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#75F663] flex-shrink-0 mt-2" />
                    <span className="text-[#4a5e3a] text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
