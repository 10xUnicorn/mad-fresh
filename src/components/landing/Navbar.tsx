"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingBag, User, ChevronDown } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Meal Prep",
    href: "/menu",
    children: [
      { label: "Weekly Menu", href: "/menu" },
      { label: "Meal Plans", href: "/#plans" },
      { label: "Delivery Areas", href: "/#delivery" },
      { label: "Nutrition Info", href: "/menu#nutrition" },
    ],
  },
  {
    label: "Catering",
    href: "/catering",
    children: [
      { label: "Corporate Catering", href: "/catering#corporate" },
      { label: "Office Lunches", href: "/catering#office" },
      { label: "Event Catering", href: "/catering#events" },
      { label: "Request a Quote", href: "/catering#quote" },
    ],
  },
  {
    label: "Food Programs",
    href: "/#food-programs",
    children: [
      { label: "Schools", href: "/#food-programs" },
      { label: "Athlete Fuel Program", href: "/#food-programs" },
      { label: "Corporate Cafeterias", href: "/#food-programs" },
      { label: "Daily Meal Contracts", href: "/#food-programs" },
    ],
  },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Our Story", href: "/about" },
      { label: "Awards & Recognition", href: "/about#awards" },
      { label: "Partners", href: "/about#partners" },
      { label: "Franchise Opportunities", href: "/about#franchise" },
    ],
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const readCart = () => {
      const s = localStorage.getItem("cart");
      if (s) {
        try {
          const items = JSON.parse(s);
          setCartCount(items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0));
        } catch { setCartCount(0); }
      } else {
        setCartCount(0);
      }
    };
    readCart();
    const handleStorage = (e: StorageEvent) => { if (e.key === "cart" || e.key === null) readCart(); };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("cart-updated", readCart);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cart-updated", readCart);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white/98 backdrop-blur-lg border-b border-[#ddd8cc] shadow-sm"
            : "bg-white border-b border-[#ddd8cc]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[70px]">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0" onClick={() => setActiveDropdown(null)}>
              <Image
                src="/images/brand/mad-fresh-logo.png"
                alt="Mad Fresh Kitchen"
                width={52}
                height={52}
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] object-contain rounded-xl"
                priority
              />
            </Link>

            {/* Desktop nav with dropdowns */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      activeDropdown === item.label
                        ? "text-[#3d6b2a] bg-[#e9f0e4]"
                        : "text-[#4a5e3a] hover:text-[#3d6b2a] hover:bg-[#f2efe8]"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        activeDropdown === item.label ? "rotate-180 text-[#3d6b2a]" : "text-[#9a9080]"
                      }`}
                    />
                  </Link>

                  {/* Dropdown panel */}
                  {activeDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-1.5 w-52 z-50">
                      <div className="bg-white border border-[#ddd8cc] rounded-xl shadow-lg overflow-hidden">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-[#4a5e3a] hover:bg-[#f2efe8] hover:text-[#3d6b2a] transition-colors font-medium"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#f2efe8] transition-all"
              >
                <ShoppingBag size={20} className="text-[#4a5e3a]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#3d6b2a] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Desktop auth */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#7a7060] hover:text-[#3d6b2a] rounded-lg hover:bg-[#f2efe8] transition-all font-medium"
                >
                  <User size={15} />
                  Log In
                </Link>
                <Link
                  href="/menu"
                  className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
                >
                  Order Now
                </Link>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setOpen(!open)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#f2efe8] transition-all"
                aria-label="Toggle menu"
              >
                {open
                  ? <X size={22} className="text-[#1e2d18]" />
                  : <Menu size={22} className="text-[#1e2d18]" />
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white border-l border-[#ddd8cc] flex flex-col overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ddd8cc]">
              <Image
                src="/images/brand/mad-fresh-logo.png"
                alt="Mad Fresh Kitchen"
                width={44}
                height={44}
                className="w-11 h-11 object-contain rounded-lg"
              />
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f2efe8] transition"
              >
                <X size={20} className="text-[#7a7060]" />
              </button>
            </div>

            {/* Top CTAs — Login, Sign Up, Order */}
            <div className="px-4 py-4 border-b border-[#ddd8cc] space-y-3">
              <div className="flex gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-[#ddd8cc] text-[#4a5e3a] px-4 py-3 rounded-full text-sm text-center font-medium min-h-[44px] flex items-center justify-center hover:bg-[#f2efe8] transition"
                >
                  <User size={15} className="mr-1.5" />
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-[#e9f0e4] text-[#3d6b2a] px-4 py-3 rounded-full text-sm text-center font-bold min-h-[44px] flex items-center justify-center hover:bg-[#d9e8d4] transition"
                >
                  Sign Up
                </Link>
              </div>
              <Link
                href="/menu"
                onClick={() => setOpen(false)}
                className="w-full bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold py-3.5 rounded-full text-center flex items-center justify-center gap-2 text-sm transition min-h-[48px]"
              >
                <ShoppingBag size={16} />
                Order Meal Prep
              </Link>
            </div>

            {/* Nav sections */}
            <nav className="flex-1 px-4 py-4 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="mb-4">
                  <p className="px-3 py-1 text-[10px] font-bold text-[#9a9080] uppercase tracking-[.1em]">
                    {item.label}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center px-3 py-3 rounded-xl text-[#4a5e3a] hover:text-[#3d6b2a] hover:bg-[#f2efe8] text-sm font-medium transition min-h-[44px]"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            {/* Bottom CTA */}
            <div className="px-4 py-4 border-t border-[#ddd8cc]">
              <Link
                href="/catering#quote"
                onClick={() => setOpen(false)}
                className="w-full bg-[#fff8ee] border border-[#f0ddb8] text-[#1e2d18] font-semibold py-3.5 rounded-full text-center flex items-center justify-center text-sm min-h-[48px] hover:bg-[#fff0dd] transition"
              >
                Request Catering Quote
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
