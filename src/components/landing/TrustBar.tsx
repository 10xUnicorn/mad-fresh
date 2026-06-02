export default function TrustBar() {
  const logos = [
    { name: "PayPal",               style: "font-bold text-[#003087]" },
    { name: "GoDaddy",              style: "font-bold text-[#1bdbdb]" },
    { name: "Amazon",               style: "font-bold text-[#FF9900]" },
    { name: "Trainual",             style: "font-bold text-[#6C47FF]" },
    { name: "PHI",                  style: "font-bold text-[#1e2d18]" },
    { name: "Arizona Rattlers",     style: "font-bold text-[#e05a0a]" },
    { name: "Dream City Christian", style: "font-bold text-[#1e2d18]" },
    { name: "Legendary Prep",       style: "font-bold text-[#c8a84b]" },
    { name: "Iron Prep",            style: "font-bold text-[#333]" },
    { name: "Fox Sports",           style: "font-bold text-[#1e2d18]" },
  ];

  // Duplicate for seamless infinite scroll
  const doubled = [...logos, ...logos];

  return (
    <section className="bg-white border-y border-[#ddd8cc] py-4 overflow-hidden">
      <div className="flex items-center gap-6 max-w-full">
        {/* Static label */}
        <span className="text-[10px] font-black text-[#9a9080] uppercase tracking-[.14em] whitespace-nowrap pl-6 flex-shrink-0">
          Trusted By
        </span>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex gap-10 items-center animate-ticker" style={{ width: "max-content" }}>
            {doubled.map((logo, i) => (
              <span
                key={i}
                className={`text-sm whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity ${logo.style}`}
              >
                {logo.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 28s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
