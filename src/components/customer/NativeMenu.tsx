"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Plus, Minus, Check, ShoppingBag, X, Flame, Clock, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RecipeCategory } from "@/types/database";

interface MenuRecipe {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: RecipeCategory;
  cuisine_type: string;
  image_url: string | null;
  base_price: number;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
  is_featured: boolean;
  spice_level: number | null;
  prep_time_minutes: number | null;
  tags: string[] | null;
  is_sold_out: boolean;
}

interface CartItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  fulfillment_type: "pickup" | "delivery";
  category: RecipeCategory;
}

const CATEGORY_META: Record<string, { label: string; image: string; emoji: string }> = {
  bowl: { label: "Bowls", image: "/images/menu/chipotle-crema-bowl.png", emoji: "🥣" },
  wrap: { label: "Wraps", image: "/images/menu/breakfast-burritos-10-500x500.jpg", emoji: "🌯" },
  salad: { label: "Salads", image: "/images/menu/lean.png", emoji: "🥗" },
  side: { label: "Sides", image: "/images/menu/sauteed-green-beans-s3.jpeg", emoji: "🥦" },
  drink: { label: "Drinks", image: "/images/menu/screenshot-2026-04-01-at-5.14.45-pm.png", emoji: "🥤" },
  dessert: { label: "Desserts", image: "/images/menu/cinnamon-protein-bars.png", emoji: "🍫" },
  snack: { label: "Snacks", image: "/images/menu/cinnamon-protein-bars.png", emoji: "⚡" },
  custom: { label: "Build Your Own", image: "/images/menu/massive.png", emoji: "🎨" },
};

const CATEGORY_ORDER = ["bowl", "wrap", "salad", "side", "drink", "dessert", "snack", "custom"];

export default function NativeMenu({ recipes, fetchError }: { recipes: MenuRecipe[]; fetchError?: string | null }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("bowl");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuRecipe | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cart");
      if (stored) setCart(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cart");
    }
    window.dispatchEvent(new Event("cart-updated"));
  }, [cart]);

  // Group recipes by category
  const grouped = useMemo(() => {
    const map: Record<string, MenuRecipe[]> = {};
    recipes.forEach((r) => {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    });
    return map;
  }, [recipes]);

  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => grouped[c] && grouped[c].length > 0),
    [grouped]
  );

  // Scroll to section when category card tapped
  const scrollToCategory = useCallback((cat: string) => {
    setActiveCategory(cat);
    const el = sectionRefs.current[cat];
    if (el) {
      const offset = 120; // header + category bar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  // Track active category on scroll
  useEffect(() => {
    const handleScroll = () => {
      const offset = 140;
      for (let i = availableCategories.length - 1; i >= 0; i--) {
        const cat = availableCategories[i];
        const el = sectionRefs.current[cat];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset) {
            setActiveCategory(cat);
            return;
          }
        }
      }
      if (availableCategories.length > 0) setActiveCategory(availableCategories[0]);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [availableCategories]);

  // Scroll active category pill into view
  useEffect(() => {
    if (categoryBarRef.current) {
      const activePill = categoryBarRef.current.querySelector(`[data-cat="${activeCategory}"]`);
      if (activePill) {
        (activePill as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeCategory]);

  // Cart helpers
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const addToCart = (recipe: MenuRecipe) => {
    if (recipe.is_sold_out) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.recipe_id === recipe.id);
      if (existing) {
        return prev.map((i) => i.recipe_id === recipe.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { recipe_id: recipe.id, name: recipe.name, price: recipe.base_price, quantity: 1, image_url: recipe.image_url, fulfillment_type: "pickup" as const, category: recipe.category }];
    });
    setAddedId(recipe.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  const updateQuantity = (recipeId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.recipe_id === recipeId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0)
    );
  };

  const getCartQty = (id: string) => cart.find((i) => i.recipe_id === id)?.quantity || 0;

  // ─── Item Detail Overlay ───
  if (selectedItem) {
    const qty = getCartQty(selectedItem.id);
    return (
      <div className="space-y-0 -mx-4 sm:-mx-6 -mt-5 sm:-mt-6">
        {/* Hero */}
        <div className="relative w-full aspect-[4/3] bg-[#f2efe8]">
          {selectedItem.image_url ? (
            <Image src={selectedItem.image_url} alt={selectedItem.name} width={400} height={300} className="absolute inset-0 w-full h-full object-cover" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
              {CATEGORY_META[selectedItem.category]?.emoji || "🍽"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f3] via-transparent to-black/20" />
          <button
            onClick={() => setSelectedItem(null)}
            aria-label="Close item detail"
            type="button"
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-lg flex items-center justify-center text-white z-10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 sm:px-6 -mt-8 relative z-10 space-y-4 pb-36">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3d6b2a]">
              {CATEGORY_META[selectedItem.category]?.label}
            </span>
            <h1 className="text-2xl font-bold text-[#1e2d18] mt-1">{selectedItem.name}</h1>
            <p className="text-xl font-bold text-[#3d6b2a] mt-1">${selectedItem.base_price.toFixed(2)}</p>
          </div>

          {selectedItem.description && (
            <p className="text-sm text-[#7a7060] leading-relaxed">{selectedItem.description}</p>
          )}

          {/* Nutrition */}
          {(selectedItem.calories || selectedItem.protein_grams) && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Cal", value: selectedItem.calories },
                { label: "Protein", value: selectedItem.protein_grams, unit: "g" },
                { label: "Carbs", value: selectedItem.carb_grams, unit: "g" },
                { label: "Fat", value: selectedItem.fat_grams, unit: "g" },
              ].map((n) => n.value != null && (
                <div key={n.label} className="bg-white border border-[#ddd8cc] rounded-xl py-3 text-center">
                  <p className="text-lg font-bold text-[#1e2d18]">{n.value}<span className="text-[10px] text-[#9a9080]">{n.unit}</span></p>
                  <p className="text-[10px] text-[#9a9080] uppercase font-medium mt-0.5">{n.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-[#9a9080]">
            {selectedItem.prep_time_minutes && (
              <span className="flex items-center gap-1"><Clock size={13} /> {selectedItem.prep_time_minutes} min</span>
            )}
            {selectedItem.spice_level != null && selectedItem.spice_level > 0 && (
              <span className="flex items-center gap-1"><Flame size={13} className="text-orange-400" /> {"🌶".repeat(selectedItem.spice_level)}</span>
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-0 right-0 z-40 px-4 pb-3 pt-3 bg-gradient-to-t from-[#faf8f3] via-[#faf8f3]/95 to-transparent lg:bottom-0">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {qty > 0 && (
              <div className="flex items-center gap-1 bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-1">
                <button type="button" aria-label={`Remove one ${selectedItem.name} from bag`} onClick={() => updateQuantity(selectedItem.id, -1)} className="w-10 h-10 flex items-center justify-center text-[#7a7060]"><Minus size={16} /></button>
                <span className="text-[#1e2d18] font-bold text-sm w-6 text-center" aria-live="polite">{qty}</span>
                <button type="button" aria-label={`Add another ${selectedItem.name} to bag`} onClick={() => updateQuantity(selectedItem.id, 1)} className="w-10 h-10 flex items-center justify-center text-[#7a7060]"><Plus size={16} /></button>
              </div>
            )}
            <button
              type="button"
              onClick={() => { addToCart(selectedItem); }}
              disabled={selectedItem.is_sold_out}
              aria-label={selectedItem.is_sold_out ? `${selectedItem.name} is sold out` : `Add ${selectedItem.name} to bag`}
              className="flex-1 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedItem.is_sold_out ? "Sold Out" : addedId === selectedItem.id ? <><Check size={18} /> Added!</> : <><Plus size={18} /> Add to Bag — ${(selectedItem.base_price * Math.max(1, qty)).toFixed(2)}</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Menu View ───
  return (
    <div className="space-y-0 -mt-2">
      {/* Title */}
      <h1 className="text-2xl font-bold text-[#1e2d18] mb-4">Menu</h1>

      {/* Error / Empty state */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600">Couldn&apos;t load the menu. Pull down to refresh.</p>
        </div>
      )}

      {!fetchError && recipes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🍽</span>
          <p className="text-lg font-semibold text-[#1e2d18]">Menu loading...</p>
          <p className="text-sm text-[#9a9080] mt-1">If nothing appears, try refreshing the page.</p>
        </div>
      )}

      {/* Category Cards — horizontal scroll */}
      <div
        ref={categoryBarRef}
        className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x snap-mandatory"
      >
        {availableCategories.filter(c => c !== "custom").map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              data-cat={cat}
              type="button"
              onClick={() => scrollToCategory(cat)}
              aria-pressed={isActive}
              aria-label={`Filter by ${meta.label}`}
              className={`flex-shrink-0 snap-start relative w-[100px] h-[80px] rounded-xl overflow-hidden transition-all duration-200 ${
                isActive ? "ring-2 ring-[#3d6b2a] ring-offset-1 ring-offset-[#faf8f3] scale-[1.02]" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={meta.image} alt={meta.label} width={80} height={80} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5">
                <p className="text-[11px] font-bold text-white leading-tight">{meta.label}</p>
                <p className="text-[9px] text-[#4a5e3a]">{grouped[cat]?.length || 0}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-8 mt-4">
        {availableCategories.filter(c => c !== "custom").map((cat) => {
          const meta = CATEGORY_META[cat];
          const items = grouped[cat] || [];
          return (
            <div
              key={cat}
              ref={(el) => { sectionRefs.current[cat] = el; }}
              id={`section-${cat}`}
            >
              {/* Section header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{meta.emoji}</span>
                <h2 className="text-lg font-bold text-[#1e2d18]">{meta.label}</h2>
                <span className="text-xs text-[#9a9080]">({items.length})</span>
              </div>

              {/* Item cards */}
              <div className="space-y-2">
                {items.map((recipe) => {
                  const qty = getCartQty(recipe.id);
                  const isAdded = addedId === recipe.id;
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => setSelectedItem(recipe)}
                      className="w-full flex items-center gap-3 bg-white border border-[#ddd8cc] rounded-2xl p-3 hover:bg-[#f0ece3] transition active:bg-[#f0ece3] text-left"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-[#f2efe8] flex-shrink-0">
                        {recipe.image_url ? (
                          <Image src={recipe.image_url} alt={recipe.name} width={160} height={160} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">{meta.emoji}</div>
                        )}
                        {qty > 0 && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#3d6b2a] flex items-center justify-center text-[10px] font-bold text-white">
                            {qty}
                          </div>
                        )}
                        {recipe.is_sold_out && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-red-400">SOLD OUT</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#1e2d18] truncate">{recipe.name}</h3>
                        {recipe.description && (
                          <p className="text-[11px] text-[#9a9080] line-clamp-2 mt-0.5 leading-tight">{recipe.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-bold text-[#3d6b2a]">${recipe.base_price.toFixed(2)}</span>
                          {recipe.calories != null && (
                            <span className="text-[10px] text-[#9a9080]">{recipe.calories} cal</span>
                          )}
                          {recipe.is_featured && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#e9f0e4] text-[#3d6b2a]">FEATURED</span>
                          )}
                        </div>
                      </div>

                      {/* Quick add */}
                      <button
                        type="button"
                        aria-label={recipe.is_sold_out ? `${recipe.name} is sold out` : `Add ${recipe.name} to bag`}
                        disabled={recipe.is_sold_out}
                        onClick={(e) => { e.stopPropagation(); addToCart(recipe); }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d6b2a] focus-visible:ring-offset-1 focus-visible:ring-offset-[#faf8f3] ${
                          recipe.is_sold_out
                            ? "bg-[#f2efe8] text-[#9a9080] cursor-not-allowed"
                            : isAdded
                              ? "bg-[#3d6b2a] text-white scale-110"
                              : "bg-[#e9f0e4] text-[#3d6b2a] hover:bg-[#e9f0e4] active:scale-95"
                        }`}
                      >
                        {isAdded ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Build Your Own */}
        {grouped["custom"] && grouped["custom"].length > 0 && (
          <div ref={(el) => { sectionRefs.current["custom"] = el; }} id="section-custom">
            <Link
              href="/dashboard#bowl-builder"
              className="block bg-gradient-to-r from-[#e9f0e4] to-[#f2efe8] border border-[#3d6b2a]/15 rounded-2xl p-5 hover:border-[#3d6b2a]/25 transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#e9f0e4] flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎨</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#1e2d18]">Build Your Own Bowl</h3>
                  <p className="text-xs text-[#9a9080] mt-0.5">Choose your protein, carbs, veggies & sauce</p>
                </div>
                <ChevronRight size={20} className="text-[#3d6b2a] flex-shrink-0" />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Cart floating bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-0 right-0 z-40 px-4 pb-3 lg:bottom-0">
          <div className="max-w-lg mx-auto">
            <Link
              href="/cart"
              className="flex items-center justify-between bg-[#3d6b2a] text-white font-bold py-3.5 px-5 rounded-xl text-sm shadow-lg shadow-[#3d6b2a]/20 hover:bg-[#2f5720] transition active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} />
                View Bag ({cartCount})
              </span>
              <span>${cartTotal.toFixed(2)}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
