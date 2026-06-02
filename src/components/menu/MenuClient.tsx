"use client";

import { useState, useEffect, useRef } from "react";
import { Recipe, RecipeCategory, RecipePreset } from "@/types/database";
import {
  ShoppingBag, X, Flame, Star, Sparkles, Loader,
  Minus, Plus, ChevronRight, RefreshCw, Info
} from "lucide-react";
import NutritionModal from "./NutritionModal";
import BowlBuilder from "./BowlBuilder";

interface CartItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  fulfillment_type: "pickup" | "delivery";
  category: RecipeCategory;
  portion_size?: string;
  portion_scale?: number;
}

interface MenuClientProps {
  recipes: Recipe[];
}

const CATEGORIES: RecipeCategory[] = ["bowl", "wrap", "salad", "side", "drink", "dessert", "snack"];

const CATEGORY_EMOJI: Record<RecipeCategory, string> = {
  bowl: "🥘", wrap: "🌯", salad: "🥗", side: "🥦",
  drink: "🥤", dessert: "🍫", snack: "🍪", custom: "⚡",
};

export default function MenuClient({ recipes }: MenuClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | "all">("all");
  const [selectedRecipeForNutrition, setSelectedRecipeForNutrition] = useState<Recipe | null>(null);
  const [selectedRecipeForOrder, setSelectedRecipeForOrder] = useState<Recipe | null>(null);
  const [selectedFulfillment, setSelectedFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [recipePresets, setRecipePresets] = useState<RecipePreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<RecipePreset | null>(null);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [showMealPlanBanner, setShowMealPlanBanner] = useState(false);
  const [showBowlBuilder, setShowBowlBuilder] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Load cart from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try { setCart(JSON.parse(stored)); } catch {}
    }
  }, []);

  // Persist cart
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("cart");
    }
    window.dispatchEvent(new Event("cart-updated"));
  }, [cart]);

  // Show meal plan banner when cart hits 3+ items
  useEffect(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems >= 3 && !showMealPlanBanner) {
      setShowMealPlanBanner(true);
    }
  }, [cart, showMealPlanBanner]);

  // Fetch presets when ordering a recipe
  useEffect(() => {
    const fetchPresets = async () => {
      if (!selectedRecipeForOrder) {
        setRecipePresets([]);
        setSelectedPreset(null);
        return;
      }
      setPresetsLoading(true);
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("recipe_presets")
          .select("*")
          .eq("recipe_id", selectedRecipeForOrder.id)
          .order("is_default", { ascending: false })
          .order("servings", { ascending: true });
        if (error) throw error;
        setRecipePresets(data || []);
        const defaultPreset = data?.find(p => p.is_default) || data?.[0] || null;
        setSelectedPreset(defaultPreset);
      } catch (error) {
        console.error("Error fetching recipe presets:", error);
        setRecipePresets([]);
        setSelectedPreset(null);
      } finally {
        setPresetsLoading(false);
      }
    };
    fetchPresets();
  }, [selectedRecipeForOrder]);

  // Lock scroll when modal open
  useEffect(() => {
    if (selectedRecipeForOrder || selectedRecipeForNutrition) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedRecipeForOrder, selectedRecipeForNutrition]);

  const filteredRecipes = selectedCategory === "all"
    ? recipes
    : recipes.filter(r => r.category === selectedCategory);

  const handleAddToCart = (recipe: Recipe, fulfillment: "pickup" | "delivery") => {
    const scaledPrice = selectedPreset
      ? recipe.base_price * selectedPreset.scale_factor
      : recipe.base_price;

    const existingItem = selectedPreset
      ? cart.find(item => item.recipe_id === recipe.id && item.portion_size === selectedPreset.name && item.fulfillment_type === fulfillment)
      : cart.find(item => item.recipe_id === recipe.id && item.fulfillment_type === fulfillment);

    if (existingItem) {
      setCart(cart.map(item =>
        item === existingItem ? { ...item, quantity: item.quantity + orderQuantity } : item
      ));
    } else {
      setCart([...cart, {
        recipe_id: recipe.id,
        name: recipe.name,
        price: scaledPrice,
        quantity: orderQuantity,
        fulfillment_type: fulfillment,
        category: recipe.category,
        portion_size: selectedPreset?.name,
        portion_scale: selectedPreset?.scale_factor,
      }]);
    }

    // Flash the "added" indicator
    setAddedItemId(recipe.id);
    setTimeout(() => setAddedItemId(null), 1200);

    setSelectedRecipeForOrder(null);
    setSelectedFulfillment("pickup");
    setSelectedPreset(null);
    setOrderQuantity(1);
  };

  // Quick add (no modal for simple items)
  const handleQuickAdd = (recipe: Recipe) => {
    const existingItem = cart.find(item => item.recipe_id === recipe.id && item.fulfillment_type === "pickup");
    if (existingItem) {
      setCart(cart.map(item =>
        item === existingItem ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        recipe_id: recipe.id,
        name: recipe.name,
        price: recipe.base_price,
        quantity: 1,
        fulfillment_type: "pickup",
        category: recipe.category,
      }]);
    }
    setAddedItemId(recipe.id);
    setTimeout(() => setAddedItemId(null), 1200);
  };

  const getItemCountInCart = (recipeId: string) => {
    return cart.filter(item => item.recipe_id === recipeId).reduce((sum, item) => sum + item.quantity, 0);
  };

  // Handle BYOB add to cart
  const handleBowlBuilderAdd = (selections: Array<{ ingredient_id: string; name: string; upcharge: number; category_slug: string }>, totalUpcharge: number) => {
    const bowlBasePrice = 12.99; // Default BYOB base price
    const bowlName = "Build Your Own Bowl";
    const customDesc = selections.map(s => s.name).join(", ");

    setCart(prev => [...prev, {
      recipe_id: `byob-${Date.now()}`,
      name: bowlName,
      price: bowlBasePrice + totalUpcharge,
      quantity: 1,
      fulfillment_type: "pickup" as const,
      category: "bowl" as const,
      portion_size: customDesc.length > 60 ? customDesc.slice(0, 60) + "…" : customDesc,
    }]);

    setShowBowlBuilder(false);
    setAddedItemId("byob");
    setTimeout(() => setAddedItemId(null), 1200);
  };

  const getCategoryLabel = (cat: RecipeCategory): string => {
    const labels: Record<RecipeCategory, string> = {
      bowl: "Bowls", wrap: "Wraps", salad: "Salads", side: "Sides",
      drink: "Drinks", dessert: "Desserts", snack: "Snacks", custom: "Custom",
    };
    return labels[cat];
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = recipes.filter(r => r.category === cat).length;
    return acc;
  }, {} as Record<RecipeCategory, number>);

  const availableCategories = CATEGORIES.filter(cat => categoryCounts[cat] > 0);

  return (
    <>
      {/* Nutrition Modal */}
      {selectedRecipeForNutrition && (
        <NutritionModal
          recipe={selectedRecipeForNutrition}
          onClose={() => setSelectedRecipeForNutrition(null)}
        />
      )}

      {/* Bowl Builder Modal */}
      {showBowlBuilder && (
        <BowlBuilder
          basePrice={12.99}
          onAddToCart={handleBowlBuilderAdd}
          onClose={() => setShowBowlBuilder(false)}
        />
      )}

      {/* Order Modal — full screen on mobile, centered on desktop */}
      {selectedRecipeForOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center mf-fade-in">
          <div className="w-full sm:max-w-md bg-white border border-[#ddd8cc] sm:rounded-2xl rounded-t-2xl sm:border sm:border-[#ddd8cc] overflow-hidden mf-sheet-up sm:mf-slide-up max-h-[90dvh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ddd8cc]">
              <div>
                <h2 className="text-lg font-bold text-[#1e2d18]">{selectedRecipeForOrder.name}</h2>
                <p className="text-sm text-[#9a9080] mt-0.5">Customize your order</p>
              </div>
              <button
                onClick={() => { setSelectedRecipeForOrder(null); setOrderQuantity(1); }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0ece3] transition"
              >
                <X size={20} className="text-[#7a7060]" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Portion Size Selection */}
              {presetsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader size={20} className="text-[#3d6b2a] animate-spin" />
                </div>
              ) : recipePresets.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Portion Size</p>
                  <div className="space-y-2">
                    {recipePresets.map(preset => {
                      const scaledPrice = selectedRecipeForOrder.base_price * preset.scale_factor;
                      const isSelected = selectedPreset?.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedPreset(preset)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                            isSelected
                              ? "border-[#3d6b2a] bg-[#e9f0e4]"
                              : "border-[#ddd8cc] hover:border-[#ddd8cc] bg-[#f2efe8]"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                            isSelected ? "border-[#3d6b2a]" : "border-[#ddd8cc]"
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#3d6b2a]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1e2d18] text-sm">{preset.name}</p>
                            <p className="text-xs text-[#9a9080]">{preset.servings} serving{preset.servings > 1 ? "s" : ""}</p>
                          </div>
                          <p className="font-bold text-[#3d6b2a] text-sm shrink-0">${scaledPrice.toFixed(2)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Fulfillment */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider">How do you want it?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedFulfillment("pickup")}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all ${
                      selectedFulfillment === "pickup"
                        ? "border-[#3d6b2a] bg-[#e9f0e4]"
                        : "border-[#ddd8cc] hover:border-[#ddd8cc]"
                    }`}
                  >
                    <span className="text-lg">🏪</span>
                    <p className={`font-semibold text-sm ${selectedFulfillment === "pickup" ? "text-[#3d6b2a]" : "text-[#1e2d18]"}`}>
                      Pickup
                    </p>
                    <p className="text-[11px] text-[#9a9080]">Same-day</p>
                  </button>
                  <button
                    onClick={() => setSelectedFulfillment("delivery")}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all ${
                      selectedFulfillment === "delivery"
                        ? "border-[#3d6b2a] bg-[#e9f0e4]"
                        : "border-[#ddd8cc] hover:border-[#ddd8cc]"
                    }`}
                  >
                    <span className="text-lg">🚗</span>
                    <p className={`font-semibold text-sm ${selectedFulfillment === "delivery" ? "text-[#3d6b2a]" : "text-[#1e2d18]"}`}>
                      Delivery
                    </p>
                    <p className="text-[11px] text-[#9a9080]">To your door</p>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Quantity</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="w-12 h-12 rounded-xl border border-[#ddd8cc] bg-[#f2efe8] text-[#1e2d18] flex items-center justify-center hover:bg-[#f0ece3] transition active:scale-95"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-2xl font-black text-[#1e2d18] w-8 text-center tabular-nums">{orderQuantity}</span>
                  <button
                    onClick={() => setOrderQuantity(Math.min(20, orderQuantity + 1))}
                    className="w-12 h-12 rounded-xl border border-[#ddd8cc] bg-[#f2efe8] text-[#1e2d18] flex items-center justify-center hover:bg-[#f0ece3] transition active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed bottom CTA */}
            <div className="px-5 py-4 border-t border-[#ddd8cc] bg-white safe-area-padding">
              <button
                onClick={() => handleAddToCart(selectedRecipeForOrder, selectedFulfillment)}
                className="btn-accent w-full font-bold py-3.5 rounded-full transition flex items-center justify-center gap-2 text-base active:scale-[0.98]"
              >
                <ShoppingBag size={18} />
                Add to Bag — ${(
                  (selectedPreset
                    ? selectedRecipeForOrder.base_price * selectedPreset.scale_factor
                    : selectedRecipeForOrder.base_price) * orderQuantity
                ).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-dvh bg-[#faf8f3] relative">
        {/* Subtle background texture */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#3d6b2a]/3 rounded-full blur-[150px]" />
          <div className="absolute bottom-[30%] left-0 w-[300px] h-[300px] bg-[#3d6b2a]/3 rounded-full blur-[120px]" />
        </div>

        {/* Header — compact, order-focused */}
        <section className="relative z-10 pt-2 pb-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18] leading-tight">
                  Menu
                </h1>
                <p className="text-sm text-[#9a9080] mt-0.5">
                  {recipes.length} items · Updated weekly
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-full px-3 py-1.5">
                  <Sparkles size={12} className="text-[#3d6b2a]" />
                  <span className="text-xs text-[#3d6b2a] font-semibold">Chef&apos;s picks this week</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Category Tabs — Chipotle-style horizontal scroll */}
        <section
          ref={categoryRef}
          className="sticky top-14 sm:top-16 z-30 bg-[#faf8f3]/95 backdrop-blur-lg border-b border-[#ddd8cc]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide -mx-1 px-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  selectedCategory === "all"
                    ? "border-[#3d6b2a] text-[#3d6b2a]"
                    : "border-transparent text-[#9a9080] hover:text-[#4a5e3a]"
                }`}
              >
                All
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "border-[#3d6b2a] text-[#3d6b2a]"
                      : "border-transparent text-[#9a9080] hover:text-[#4a5e3a]"
                  }`}
                >
                  <span className="text-base">{CATEGORY_EMOJI[cat]}</span>
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Meal Plan Banner — shows after 3+ items */}
        {showMealPlanBanner && cartCount >= 3 && (
          <section className="relative z-10 px-4 sm:px-6 lg:px-8 pt-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-[#e9f0e4]/50 border border-[#3d6b2a]/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#e9f0e4] flex items-center justify-center shrink-0">
                    <RefreshCw size={18} className="text-[#3d6b2a]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#1e2d18] font-semibold text-sm">Turn this into a meal plan</p>
                    <p className="text-[#7a7060] text-xs">Save 15% with weekly delivery</p>
                  </div>
                </div>
                <a
                  href="/subscription"
                  className="shrink-0 px-4 py-2 bg-[#3d6b2a] text-white font-bold text-xs rounded-full hover:bg-[#2f5720] transition flex items-center gap-1"
                >
                  See Plans
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Recipe Grid */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {/* Build Your Own Bowl — Featured CTA card */}
              {(selectedCategory === "all" || selectedCategory === "bowl") && (
                <button
                  onClick={() => setShowBowlBuilder(true)}
                  className="relative rounded-xl overflow-hidden transition-all duration-200 group bg-[#e9f0e4] border-2 border-dashed border-[#3d6b2a]/20 hover:border-[#3d6b2a]/40 text-left col-span-1"
                >
                  <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center bg-[#f2efe8]">
                    <div className="text-center">
                      <span className="text-5xl sm:text-6xl block mb-2">🥗</span>
                      <span className="text-[10px] font-bold text-[#3d6b2a]/80 uppercase tracking-widest">Customize It</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#1e2d18] leading-snug">
                      Build Your Own Bowl
                    </h3>
                    <p className="text-[11px] text-[#9a9080]">Pick your base, protein, toppings & sauce</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base sm:text-lg font-black text-[#3d6b2a]">From $12.99</span>
                      <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#3d6b2a] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={18} />
                      </span>
                    </div>
                  </div>
                </button>
              )}

              {filteredRecipes.map(recipe => {
                const isSoldOut = recipe.is_sold_out;
                const isFeatured = recipe.is_featured;
                const hasImage = !!recipe.image_url;
                const inCartCount = getItemCountInCart(recipe.id);
                const justAdded = addedItemId === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    className={`relative rounded-xl overflow-hidden transition-all duration-200 group bg-white border border-[#ddd8cc] ${
                      isFeatured
                        ? "border-[#3d6b2a]/20 ring-1 ring-[#3d6b2a]/15"
                        : "border-[#ddd8cc] hover:border-[#ddd8cc]"
                    } ${isSoldOut ? "opacity-60" : ""}`}
                  >
                    {/* Featured Badge */}
                    {isFeatured && (
                      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-[#3d6b2a] backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        <Flame size={10} className="mf-flame" />
                        PICK
                      </div>
                    )}

                    {/* Cart count badge */}
                    {inCartCount > 0 && (
                      <div className={`absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        justAdded ? "bg-[#3d6b2a] text-white scale-110" : "bg-[#3d6b2a] text-white"
                      }`}>
                        {inCartCount}
                      </div>
                    )}

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600/90 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                          SOLD OUT
                        </span>
                      </div>
                    )}

                    {/* Image — taller aspect ratio for impact */}
                    <div className={`aspect-[4/3] relative overflow-hidden ${
                      hasImage ? "" : "bg-[#f2efe8] flex items-center justify-center"
                    }`}>
                      {hasImage ? (
                        <img
                          src={recipe.image_url!}
                          alt={recipe.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl">{CATEGORY_EMOJI[recipe.category] || "🥗"}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 space-y-2">
                      {/* Name */}
                      <h3 className="text-sm sm:text-base font-bold text-[#1e2d18] leading-snug line-clamp-2">
                        {recipe.name}
                      </h3>

                      {/* Nutrition quick stats */}
                      {(recipe.calories || recipe.protein_grams) && (
                        <div className="flex gap-2 text-[11px] text-[#9a9080]">
                          {recipe.calories && (
                            <span><span className="text-[#4a5e3a] font-medium">{recipe.calories}</span> cal</span>
                          )}
                          {recipe.protein_grams && (
                            <span><span className="text-[#4a5e3a] font-medium">{recipe.protein_grams}g</span> protein</span>
                          )}
                        </div>
                      )}

                      {/* Price + Add button */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base sm:text-lg font-black text-[#3d6b2a]">
                          {recipe.base_price > 0 ? `$${recipe.base_price.toFixed(2)}` : "Market"}
                        </span>
                        {!isSoldOut && recipe.base_price > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecipeForOrder(recipe);
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                              isFeatured
                                ? "bg-[#3d6b2a] text-white hover:bg-[#2f5720]"
                                : "bg-[#e9f0e4] text-[#3d6b2a] hover:bg-[#dce8d5]"
                            }`}
                          >
                            <Plus size={18} />
                          </button>
                        )}
                      </div>

                      {/* Nutrition info link */}
                      <button
                        onClick={() => setSelectedRecipeForNutrition(recipe)}
                        className="flex items-center gap-1 text-[11px] text-[#9a9080] hover:text-[#3d6b2a] transition"
                      >
                        <Info size={10} />
                        Nutrition
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredRecipes.length === 0 && (
              <div className="text-center py-16">
                <span className="text-4xl mb-3 block">🍽️</span>
                <p className="text-lg text-[#7a7060] font-medium">No items in this category yet</p>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="mt-3 text-sm text-[#3d6b2a] hover:underline font-semibold"
                >
                  View all items
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Bottom Cart Bar — Chipotle-style */}
      {cartCount > 0 && (
        <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-0 right-0 z-40 lg:bottom-0">
          <div className="px-4 pb-3 sm:pb-4 pt-2">
            <a
              href="/cart"
              className="max-w-lg mx-auto flex items-center justify-between bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-full px-5 py-3.5 shadow-xl shadow-[#3d6b2a]/20 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-[#3d6b2a] text-[9px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <span className="font-bold text-sm">View Bag</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base">${cartTotal.toFixed(2)}</span>
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
