const steps = [
  {
    step: "1",
    title: "Create Account & Choose Your Delivery Date",
    description: "Sign up in minutes. Pick your delivery day and order frequency — weekly, bi-weekly, or one-time. Pickup available any day.",
    img: "/images/menu/how-it-works-1.png",
    emoji: "📋",
  },
  {
    step: "2",
    title: "Choose Your Meals & Snacks",
    description: "Browse the weekly rotating menu. Build your box from 10+ chef-crafted protein bowls. Order deadline is Friday at noon.",
    img: "/images/menu/how-it-works-2.png",
    emoji: "🥗",
  },
  {
    step: "3",
    title: "We Prepare and Cook Your Order",
    description: "Our kitchen fires up early Sunday morning using fresh, organic ingredients. Every meal is sealed at peak freshness.",
    img: "/images/menu/how-it-works-3.png",
    emoji: "👨‍🍳",
  },
  {
    step: "4",
    title: "Reheat & Enjoy!",
    description: "2–3 minutes in the microwave. Meals stay fresh up to 5 days, or freeze for 2 weeks.",
    img: "/images/menu/how-it-works-4.png",
    emoji: "🎉",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-[#faf8f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-3">How It Works</p>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight">
            Done for You. Zero Guesswork.
          </h2>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => (
            <div
              key={step.step}
              className="relative bg-white border border-[#ddd8cc] rounded-2xl p-6 hover:shadow-md hover:border-[#3d6b2a] transition-all group"
            >
              {/* Big step number — background watermark */}
              <span className="absolute top-3 right-4 text-6xl font-black text-[#f2efe8] group-hover:text-[#e9f0e4] transition-colors select-none leading-none pointer-events-none">
                {step.step}
              </span>

              {/* Step badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#3d6b2a] text-white rounded-full flex items-center justify-center text-sm font-black flex-shrink-0">
                  {step.step}
                </div>
                <span className="text-base">{step.emoji}</span>
              </div>

              <h3 className="text-sm font-bold text-[#1e2d18] mb-2 leading-snug pr-4">{step.title}</h3>
              <p className="text-sm text-[#7a7060] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#fff8ee] border border-[#f0ddb8] rounded-full px-5 py-2.5">
            <span className="text-sm font-semibold text-[#b45309]">
              📅 Order deadline: <strong>Friday at noon</strong> — Delivery every Sunday Valleywide
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
