"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Minus, ShoppingBag, X, ChevronRight, Flame,
  Sparkles, Star, Loader, Check, Info, ArrowRight
} from "lucide-react";
import { Recipe, RecipeCategory } from "@/types/database";
import BowlBuilder from "@/components/menu/BowlBuilder";

/* ── Types ── */
interface CartItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  category: RecipeCategory;
  portion_size?: string;
  fulfillment_type: "pickup" | "delivery";
}

interface Recommendation {
  recipe: Recipe;
  reason: string;
  badge?: string;
  bonus_points?: number;
}

interface DashboardOrderSectionProps {
  recipes: Recipe[];
  recommendations: Recommendation[];
  userId: string;
}

/* ── Constants ── */
const CATEGORIES: RecipeCategory[] = ["bowl", "wrap", "salad", "side", "drink", "dessert", "snack"];
const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  bowl: "🥘", wrap: "🌯", salad: "🥗", side: "🥦",
  drink: "🥤", dessert: "🍫", snack: "🍪", custom: "⚡",
};
const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  bowl: "Bowls", wrap: "Wraps", salad: "Salads", side: "Sides",
  drink: "Drinks", dessert: "Desserts", snack: "Snacks", custom: "Custom",
};

export default function DashboardOrderSection({
  recipes,
  recommendations,
  userId,
}: DashboardOrderSectionProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | "all">("all");
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [showBowlBuilder, setShowBowlBuilder] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  const filteredRecipes = selectedCategory === "all"
    ? recipes
    : recipes.filter(r => r.category === selectedCategory);

  const availableCategories = CATEGORIES.filter(cat =>
    recipes.some(r => r.category === cat)
  );

  /* ── Cart operations ── */
  const addToCart = (recipe: Recipe) => {
    const existing = cart.find(item => item.recipe_id === recipe.id);
    if (existing) {
      setCart(cart.map(item =>
        item.recipe_id === recipe.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        recipe_id: recipe.id,
        name: recipe.name,
        price: recipe.base_price,
        quantity: 1,
        category: recipe.category,
        fulfillment_type: "pickup",
      }]);
    }
    setAddedItemId(recipe.id);
    setTimeout(() => setAddedItemId(null), 1000);
  };

  const updateQuantity = (recipeId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.recipe_id !== recipeId) return item;
      const newQty = item.quantity + delta;
      return newQty <= 0 ? null : { ...item, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  };

  const handleBowlBuilderAdd = (
    selections: Array<{ ingredient_id: string; name: string; upcharge: number; category_slug: string }>,
    totalUpcharge: number
  ) => {
    const desc = selections.map(s => s.name).join(", ");
    setCart(prev => [...prev, {
      recipe_id: `byob-${Date.now()}`,
      name: "Build Your Own Bowl",
      price: 12.99 + totalUpcharge,
      quantity: 1,
      category: "bowl" as RecipeCategory,
      portion_size: desc.length > 50 ? desc.slice(0, 50) + "…" : desc,
      fulfillment_type: "pickup",
    }]);
    setShowBowlBuilder(false);
    setAddedItemId("byob");
    setTimeout(() => setAddedItemId(null), 1000);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const getItemCount = (recipeId: string) =>
    cart.find(i => i.recipe_id === recipeId)?.quantity || 0;

  return (
    <>
      {/* Bowl Builder Modal */}
      {showBowlBuilder && (
        <BowlBuilder
          basePrice={12.99}
          onAddToCart={handleBowlBuilderAdd}
          onClose={() => setShowBowlBuilder(false)}
        />
      )}

      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1e2d18] flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#3d6b2a]" />
              Order Now
            </h2>
            <p className="text-xs text-[#9a9080] mt-0.5">{recipes.length} items available</p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#3d6b2a]" />
                Recommended for You
              </p>
              <div className="flex items-center gap-1 text-[10px] text-[#9a9080] sm:hidden animate-pulse">
                <span>Scroll</span>
                <ArrowRight size={12} className="text-[#3d6b2a]" />
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {recommendations.map((rec, i) => {
                const inCart = getItemCount(rec.recipe.id);
                const isGlow = i === 0;
                return (
                  <div
                    key={rec.recipe.id + i}
                    className={`flex-shrink-0 w-[200px] bg-white border border-[#ddd8cc] rounded-xl overflow-hidden group transition relative ${
                      isGlow
                        ? "border-[#3d6b2a]/40 shadow-[0_0_18px_rgba(61,107,42,0.10)] ring-1 ring-[#3d6b2a]/20"
                        : "hover:border-[#3d6b2a]/20"
                    }`}
                    style={isGlow ? { isolation: "isolate" } : undefined}
                  >
                    {/* Shimmer effect on featured card */}
                    {isGlow && (
                      <div
                        className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-xl"
                        aria-hidden="true"
                      >
                        <div
                          className="absolute -inset-full"
                          style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(61,107,42,0.06) 45%, rgba(61,107,42,0.12) 50%, rgba(61,107,42,0.06) 55%, transparent 60%)",
                            animation: "mf-shimmer 3s ease-in-out infinite",
                          }}
                        />
                      </div>
                    )}
                    {/* Image */}
                    <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-[#f2efe8] to-[#ede9e2] flex items-center justify-center">
                      {rec.recipe.image_url ? (
                        <img src={rec.recipe.image_url} alt={rec.recipe.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-3xl">{CATEGORY_EMOJI[rec.recipe.category] || "🥗"}</span>
                      )}
                      {/* Badge */}
                      {rec.badge && (
                        <div className="absolute top-1.5 left-1.5 bg-[#449531]/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          {rec.badge === "favorite" && <><Flame size={9} /> Fave</>}
                          {rec.badge === "new" && <><Sparkles size={9} /> New</>}
                          {rec.badge === "points" && <><Star size={9} /> +pts</>}
                        </div>
                      )}
                      {inCart > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#3d6b2a] rounded-full flex items-center justify-center text-[9px] font-black text-white">
                          {inCart}
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <h4 className="text-xs font-bold text-[#1e2d18] line-clamp-1">{rec.recipe.name}</h4>
                      <p className="text-[10px] text-[#9a9080] line-clamp-1">{rec.reason}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-black text-[#3d6b2a]">${rec.recipe.base_price.toFixed(2)}</span>
                        {rec.bonus_points && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            +{rec.bonus_points} pts
                          </span>
                        )}
                        <button
                          onClick={() => addToCart(rec.recipe)}
                          className="w-7 h-7 rounded-full bg-[#3d6b2a] text-white flex items-center justify-center hover:bg-[#2f5720] active:scale-90 transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div
          ref={categoryRef}
          className="flex gap-1.5 overflow-x-auto pb-0 scrollbar-hide -mx-1 px-1"
        >
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-full transition-all ${
              selectedCategory === "all"
                ? "bg-[#e9f0e4] text-[#3d6b2a] ring-1 ring-[#3d6b2a]/25"
                : "bg-[#f2efe8] text-[#9a9080] hover:text-[#4a5e3a] hover:bg-[#f0ece3]"
            }`}
          >
            All
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-full transition-all flex items-center gap-1 ${
                selectedCategory === cat
                  ? "bg-[#e9f0e4] text-[#3d6b2a] ring-1 ring-[#3d6b2a]/25"
                  : "bg-[#f2efe8] text-[#9a9080] hover:text-[#4a5e3a] hover:bg-[#f0ece3]"
              }`}
            >
              <span className="text-xs">{CATEGORY_EMOJI[cat]}</span>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Recipe Grid — compact for dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Build Your Own Bowl CTA */}
          {(selectedCategory === "all" || selectedCategory === "bowl") && (
            <button
              onClick={() => setShowBowlBuilder(true)}
              className="relative rounded-xl overflow-hidden transition-all group bg-gradient-to-br from-[#449531]/15 to-[#3d6b2a]/8 border border-dashed border-[#3d6b2a]/25 hover:border-[#3d6b2a]/50 text-left"
            >
              <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-[#f2efe8] to-[#ede9e2]">
                <div className="text-center">
                  <span className="text-4xl block mb-1">🥗</span>
                  <span className="text-[9px] font-bold text-[#3d6b2a]/80 uppercase tracking-widest">Customize</span>
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="text-xs font-bold text-[#1e2d18]">Build Your Own Bowl</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-black text-[#3d6b2a]">$12.99+</span>
                  <span className="w-7 h-7 rounded-full bg-[#3d6b2a] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={14} />
                  </span>
                </div>
              </div>
            </button>
          )}

          {filteredRecipes.map(recipe => {
            const isSoldOut = recipe.is_sold_out;
            const isFeatured = recipe.is_featured;
            const inCart = getItemCount(recipe.id);
            const justAdded = addedItemId === recipe.id;

            return (
              <div
                key={recipe.id}
                className={`relative rounded-xl overflow-hidden transition-all group bg-white border ${
                  isFeatured ? "border-[#3d6b2a]/20" : "border-[#ddd8cc] hover:border-[#ddd8cc]"
                } ${isSoldOut ? "opacity-50" : ""}`}
              >
                {isFeatured && (
                  <div className="absolute top-1.5 left-1.5 z-20 flex items-center gap-0.5 bg-[#449531]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    <Flame size={9} /> Pick
                  </div>
                )}
                {inCart > 0 && (
                  <div className={`absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                    justAdded ? "bg-[#3d6b2a] text-white scale-110" : "bg-[#3d6b2a]/90 text-white"
                  }`}>
                    {inCart}
                  </div>
                )}
                {isSoldOut && (
                  <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-600/90 text-white font-bold text-[10px] px-2 py-1 rounded-full">SOLD OUT</span>
                  </div>
                )}
                <div className={`aspect-[4/3] overflow-hidden ${
                  recipe.image_url ? "" : "bg-gradient-to-br from-[#f2efe8] to-[#ede9e2] flex items-center justify-center"
                }`}>
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" loading="lazy" />
                  ) : (
                    <span className="text-3xl">{CATEGORY_EMOJI[recipe.category] || "🥗"}</span>
                  )}
                </div>
                <div className="p-2.5 space-y-1">
                  <h3 className="text-xs font-bold text-[#1e2d18] line-clamp-2 leading-snug">{recipe.name}</h3>
                  {(recipe.calories || recipe.protein_grams) && (
                    <p className="text-[10px] text-[#9a9080]">
                      {recipe.calories && <span>{recipe.calories} cal</span>}
                      {recipe.calories && recipe.protein_grams && " · "}
                      {recipe.protein_grams && <span>{recipe.protein_grams}g protein</span>}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-sm font-black text-[#3d6b2a]">
                      {recipe.base_price > 0 ? `$${recipe.base_price.toFixed(2)}` : "Market"}
                    </span>
                    {!isSoldOut && recipe.base_price > 0 && (
                      <button
                        onClick={() => addToCart(recipe)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                          isFeatured
                            ? "bg-[#3d6b2a] text-white hover:bg-[#2f5720]"
                            : "bg-[#f2efe8] text-[#1e2d18] hover:bg-[#449531] hover:text-white"
                        }`}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-8">
            <span className="text-3xl mb-2 block">🍽️</span>
            <p className="text-sm text-[#9a9080]">No items in this category yet</p>
            <button onClick={() => setSelectedCategory("all")} className="text-xs text-[#3d6b2a] hover:underline font-semibold mt-2">
              View all items
            </button>
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-0 right-0 z-40 lg:bottom-0 lg:left-60">
          <div className="px-4 pb-3 pt-2">
            <button
              onClick={() => setShowCart(true)}
              className="max-w-lg mx-auto flex items-center justify-between w-full bg-[#449531] hover:bg-[#3a8229] text-white rounded-full px-5 py-3.5 shadow-xl shadow-[#449531]/30 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-[#449531] text-[9px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <span className="font-bold text-sm">View Bag</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base">${cartTotal.toFixed(2)}</span>
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl sm:border sm:border-[#ddd8cc] max-h-[85dvh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ddd8cc]">
              <h2 className="text-lg font-bold text-[#1e2d18]">Your Bag</h2>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0ece3] transition">
                <X size={20} className="text-[#7a7060]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map(item => (
                <div key={item.recipe_id} className="flex items-center gap-3 bg-white border border-[#ddd8cc] rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1e2d18] truncate">{item.name}</p>
                    {item.portion_size && (
                      <p className="text-[10px] text-[#9a9080] truncate mt-0.5">{item.portion_size}</p>
                    )}
                    <p className="text-xs text-[#3d6b2a] font-bold mt-0.5">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#f2efe8] rounded-full px-1 py-1">
                    <button
                      onClick={() => updateQuantity(item.recipe_id, -1)}
                      className="w-7 h-7 rounded-full bg-[#f2efe8] text-[#1e2d18] flex items-center justify-center hover:bg-[#ede9e2] transition"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-[#1e2d18] font-bold text-xs w-4 text-center tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.recipe_id, 1)}
                      className="w-7 h-7 rounded-full bg-[#f2efe8] text-[#1e2d18] flex items-center justify-center hover:bg-[#ede9e2] transition"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals + Checkout */}
            <div className="border-t border-[#ddd8cc] px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#7a7060]">Subtotal</span>
                <span className="text-base font-black text-[#1e2d18]">${cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-[#9a9080]">Tax and delivery calculated at checkout</p>
              <a
                href={`/checkout?items=${encodeURIComponent(JSON.stringify(cart))}`}
                className="w-full flex items-center justify-center gap-2 bg-[#3d6b2a] text-white font-bold py-3.5 rounded-full text-sm hover:bg-[#2f5720] active:scale-[0.98] transition"
              >
                <ShoppingBag size={16} />
                Checkout · ${cartTotal.toFixed(2)}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
