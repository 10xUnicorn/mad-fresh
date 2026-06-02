import Link from "next/link";

const PROGRAMS = [
  {
    emoji: "🏫",
    title: "School Lunch Programs",
    desc: "Daily fresh meals for students — organic, balanced, and kid-approved. Scalable from one campus to a district.",
  },
  {
    emoji: "🏋️",
    title: "Athlete Fuel Programs",
    desc: "Performance nutrition for teams, academies, and training centers. Macro-targeted meals built around sport and recovery.",
  },
  {
    emoji: "🏢",
    title: "Corporate Cafeteria Replacement",
    desc: "Replace the vending machine. Daily breakfast, lunch, and dinner contracts for office buildings and campuses.",
  },
  {
    emoji: "🧓",
    title: "Senior Living Contracts",
    desc: "Nutritious, easy-to-reheat meals for senior communities. Consistent quality, low-sodium, tailored dietary needs.",
  },
  {
    emoji: "💚",
    title: "Recovery Centers",
    desc: "Clean, healing food for recovery facilities. We understand that nutrition is part of the recovery journey.",
  },
  {
    emoji: "🎯",
    title: "Performance Academies",
    desc: "Fuel young athletes and performers with meals designed around their training demands and growth needs.",
  },
];

export default function FoodPrograms() {
  return (
    <section id="food-programs" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-2 gap-14 items-start">

          {/* Left: header + CTA */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-3">
              Recurring Food Service
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight leading-tight mb-6">
              We&apos;re Not Just a<br />
              <span className="text-[#3d6b2a]">Meal Prep Company.</span>
            </h2>
            <p className="text-[#7a7060] leading-relaxed mb-4">
              Most meal prep companies fail because meal prep alone is a difficult business. What makes Mad Fresh different is that we&apos;ve built multiple revenue streams across three buyer types.
            </p>
            <p className="text-[#7a7060] leading-relaxed mb-6">
              A future franchisee shouldn&apos;t see &ldquo;a meal prep company.&rdquo; They should see a <strong className="text-[#1e2d18]">diversified food service model</strong> — retail, delivery, catering, corporate, schools, athlete programs, and events under one brand.
            </p>

            <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-2xl p-5 mb-8">
              <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.1em] mb-2">
                Mad Fresh Serves
              </p>
              <div className="flex flex-wrap gap-2">
                {["Retail","Delivery","Catering","Corporate","Schools","Athlete Programs","Events"].map((tag) => (
                  <span key={tag} className="bg-white border border-[#ddd8cc] text-[#4a5e3a] text-xs font-semibold px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/catering#quote"
              className="inline-flex items-center gap-2 bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold px-7 py-4 rounded-full transition-colors"
            >
              Contact Us About Food Programs →
            </Link>
          </div>

          {/* Right: program cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {PROGRAMS.map((p) => (
              <div key={p.title} className="bg-[#faf8f3] border border-[#ddd8cc] rounded-2xl p-5 hover:border-[#3d6b2a] hover:bg-[#f2efe8] transition-all">
                <span className="text-2xl mb-3 block">{p.emoji}</span>
                <h3 className="text-sm font-black text-[#1e2d18] mb-2">{p.title}</h3>
                <p className="text-xs text-[#7a7060] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
