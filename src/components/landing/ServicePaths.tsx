import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PATHS = [
  {
    emoji: "🥗",
    tag: "Individual & Family",
    tagColor: "bg-[#e9f0e4] text-[#3d6b2a]",
    title: "Meal Prep Delivery",
    description:
      "Weekly handcrafted meals delivered every Sunday. Organic, no seed oils, gluten-free friendly. Build your plan from our rotating menu — no commitment required.",
    subItems: ["Weekly Meal Prep", "Daily Kitchen Ordering", "Family Meal Plans", "Athlete Meal Plans"],
    cta: "Build My Plan",
    href: "/menu",
    cardStyle: "bg-white border border-[#ddd8cc] hover:border-[#3d6b2a] hover:shadow-md",
    ctaStyle: "text-[#3d6b2a] hover:underline",
  },
  {
    emoji: "🏢",
    tag: "Corporate & Events",
    tagColor: "bg-[#3d6b2a] text-white",
    title: "Catering & Events",
    description:
      "Office lunches, conferences, executive retreats, and employee wellness programs. Trusted by PayPal, GoDaddy, and 50+ Arizona companies. From $12.95/person.",
    subItems: ["Office Lunches", "Corporate Catering", "Multi-Day Events", "Executive Retreats", "Employee Wellness"],
    cta: "Request a Quote",
    href: "/catering#quote",
    cardStyle: "bg-[#3d6b2a] border border-[#3d6b2a] hover:shadow-lg text-white",
    ctaStyle: "text-[#a8d48a] hover:underline",
    featured: true,
  },
  {
    emoji: "🏫",
    tag: "Schools & Institutions",
    tagColor: "bg-[#fff8ee] text-[#b45309] border border-[#f0ddb8]",
    title: "Recurring Food Service",
    description:
      "Daily lunch contracts, athlete fuel programs, corporate cafeteria replacement, senior living, recovery centers, and performance academies. Built for long-term partnerships.",
    subItems: ["School Lunch Programs", "Athlete Fuel Programs", "Corporate Cafeterias", "Senior Living", "Recovery Centers"],
    cta: "Explore Programs",
    href: "/#food-programs",
    cardStyle: "bg-white border border-[#ddd8cc] hover:border-[#3d6b2a] hover:shadow-md",
    ctaStyle: "text-[#3d6b2a] hover:underline",
  },
];

export default function ServicePaths() {
  return (
    <section id="services" className="py-20 bg-[#f2efe8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold text-[#9a9080] uppercase tracking-[.12em] mb-3">How Can We Feed Your Team?</p>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight leading-tight mb-4">
            Three Ways We Fuel Arizona
          </h2>
          <p className="text-[#7a7060] text-base leading-relaxed">
            A mom ordering 10 meals needs different info than a PayPal facilities manager.
            A school athletic director needs different info than a DoorDash customer.
            We built three distinct pathways — each one made for a different buyer.
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {PATHS.map((path) => (
            <div key={path.title} className={`rounded-2xl p-8 transition-all duration-200 flex flex-col ${path.cardStyle}`}>
              <span className="text-4xl mb-5 block">{path.emoji}</span>
              <span className={`inline-flex items-center text-[10px] font-bold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase ${path.tagColor}`}>
                {path.tag}
              </span>
              <h3 className={`text-xl font-black mb-3 ${path.featured ? "text-white" : "text-[#1e2d18]"}`}>
                {path.title}
              </h3>
              <p className={`text-sm leading-relaxed mb-5 ${path.featured ? "text-[rgba(255,255,255,.8)]" : "text-[#7a7060]"}`}>
                {path.description}
              </p>
              <ul className="space-y-1.5 mb-6 flex-1">
                {path.subItems.map((item) => (
                  <li key={item} className={`text-xs flex items-center gap-2 ${path.featured ? "text-[rgba(255,255,255,.7)]" : "text-[#9a9080]"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={path.href} className={`inline-flex items-center gap-1.5 text-sm font-bold mt-auto ${path.ctaStyle}`}>
                {path.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
