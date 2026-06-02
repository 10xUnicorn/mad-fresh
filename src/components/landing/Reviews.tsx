"use client";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Jessica M.",
    role: "Fitness Coach",
    text: "Mad Fresh has been my go-to for meal prep for over 3 years. The quality is unmatched — fresh, flavorful, and perfectly portioned. My clients love them too!",
    rating: 5,
  },
  {
    name: "Marcus T.",
    role: "Corporate Team Lead",
    text: "We order catering for our team every week. The setup is professional, the food is incredible, and Ty & Blanca always go above and beyond. Best of the Valley for a reason.",
    rating: 5,
  },
  {
    name: "Sarah K.",
    role: "Busy Mom of 3",
    text: "These meals save me hours every week. My kids actually love the food, which says a lot. The gluten-free options are amazing and I never worry about what's in them.",
    rating: 5,
  },
  {
    name: "David R.",
    role: "ASU Athlete",
    text: "The Grilled Fajita Bowl is insane — the meat is literally perfect. Grass-fed steak meals with perfect portions. Not many meal prep companies offer customization like Mad Fresh does.",
    rating: 5,
  },
  {
    name: "Amanda L.",
    role: "Yoga Instructor",
    text: "Clean eating made easy. I've tried every meal prep in the Valley and Mad Fresh is hands-down the best. Organic, low-sodium, and the flavors are incredible.",
    rating: 5,
  },
  {
    name: "Carlos G.",
    role: "Operations Manager, Trainual",
    text: "We use Mad Fresh for our office lunches every week. The team loves it, the pricing is fair, and the reliability is unmatched. Professional catering without the hassle.",
    rating: 5,
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className="py-20 bg-[#faf8f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-3">Real Results</p>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight mb-4">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="text-[#f59e0b] fill-[#f59e0b]" />
              ))}
            </div>
            <span className="text-[#1e2d18] font-black text-lg">4.6</span>
            <span className="text-[#7a7060] text-sm">· 105 Google Reviews</span>
          </div>
        </div>

        {/* Review grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-white border border-[#ddd8cc] rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-3">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-[#f59e0b] fill-[#f59e0b]" />
                ))}
              </div>
              <p className="text-sm text-[#4a5e3a] leading-relaxed mb-4 italic">"{r.text}"</p>
              <div>
                <p className="text-sm font-bold text-[#1e2d18]">{r.name}</p>
                <p className="text-xs text-[#9a9080]">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
