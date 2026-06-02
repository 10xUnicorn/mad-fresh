import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

const NAV_COLS = [
  {
    heading: "Meal Prep",
    links: [
      { label: "Weekly Menu", href: "/menu" },
      { label: "Meal Plans", href: "/#plans" },
      { label: "Delivery Areas", href: "/#delivery" },
      { label: "Nutrition Info", href: "/menu#nutrition" },
    ],
  },
  {
    heading: "Catering",
    links: [
      { label: "Corporate Catering", href: "/catering#corporate" },
      { label: "Office Lunches", href: "/catering#office" },
      { label: "Event Catering", href: "/catering#events" },
      { label: "Request a Quote", href: "/catering#quote" },
    ],
  },
  {
    heading: "Food Programs",
    links: [
      { label: "Schools", href: "/#food-programs" },
      { label: "Athlete Fuel", href: "/#food-programs" },
      { label: "Corporate Cafeterias", href: "/#food-programs" },
      { label: "Franchise Opportunities", href: "/about#franchise" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Awards & Recognition", href: "/about#awards" },
      { label: "Partners", href: "/about#partners" },
      { label: "Community Impact", href: "/#impact" },
    ],
  },
];

const HOURS = [
  { day: "Mon – Sat", hours: "8:00 am – 6:00 pm" },
  { day: "Sun", hours: "11:00 am – 3:00 pm" },
];

export default function Footer() {
  return (
    <footer className="bg-[#111b0e] border-t border-[rgba(255,255,255,.05)]">

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid lg:grid-cols-6 gap-10">

          {/* Brand column — 2 cols wide */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/images/brand/mad-fresh-logo.png"
                alt="Mad Fresh Kitchen"
                width={44}
                height={44}
                className="w-11 h-11 object-contain rounded-xl"
              />
              <div>
                <p className="text-sm font-black text-white leading-tight">MAD FRESH</p>
                <p className="text-[10px] text-[rgba(255,255,255,.4)] font-semibold tracking-wider">KITCHEN</p>
              </div>
            </Link>

            <p className="text-sm text-[rgba(255,255,255,.5)] leading-relaxed max-w-xs">
              Arizona&apos;s cleanest meal prep service since 2018. Award-winning flavor, delivered at your convenience. Family-owned by Ty &amp; Blanca.
            </p>

            {/* Contact info */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-[rgba(255,255,255,.45)]">
                <MapPin size={13} className="mt-0.5 flex-shrink-0 text-[#3d6b2a]" />
                <span>455 S 48th St, Tempe, Arizona 85281</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,.45)]">
                <Phone size={13} className="flex-shrink-0 text-[#3d6b2a]" />
                <a href="tel:4803827755" className="hover:text-white transition-colors">(480) 382-7755</a>
              </div>
              <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,.45)]">
                <Mail size={13} className="flex-shrink-0 text-[#3d6b2a]" />
                <a href="mailto:Order@EatMadFresh.com" className="hover:text-white transition-colors">Order@EatMadFresh.com</a>
              </div>
            </div>

            {/* Hours */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={12} className="text-[#3d6b2a]" />
                <span className="text-[10px] font-bold text-[rgba(255,255,255,.35)] uppercase tracking-wider">Hours</span>
              </div>
              {HOURS.map((h) => (
                <div key={h.day} className="flex justify-between text-xs text-[rgba(255,255,255,.45)] max-w-[200px]">
                  <span>{h.day}</span>
                  <span>{h.hours}</span>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com/eatmadfresh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[rgba(255,255,255,.06)] flex items-center justify-center hover:bg-[#3d6b2a] transition-colors"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[rgba(255,255,255,.6)]">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="mailto:Order@EatMadFresh.com"
                className="w-9 h-9 rounded-full bg-[rgba(255,255,255,.06)] flex items-center justify-center hover:bg-[#3d6b2a] transition-colors"
                aria-label="Email"
              >
                <Mail size={15} className="text-[rgba(255,255,255,.6)]" />
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[10px] font-bold text-[rgba(255,255,255,.35)] uppercase tracking-[.12em] mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[rgba(255,255,255,.5)] hover:text-[#75F663] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgba(255,255,255,.05)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[rgba(255,255,255,.3)]">
            © {new Date().getFullYear()} Mad Fresh Kitchen. All rights reserved. Family-owned in Tempe, Arizona.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-[rgba(255,255,255,.3)] hover:text-[rgba(255,255,255,.6)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-[rgba(255,255,255,.3)] hover:text-[rgba(255,255,255,.6)] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
