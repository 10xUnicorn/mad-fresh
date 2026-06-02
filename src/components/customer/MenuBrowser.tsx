"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Flame, Clock, Plus, Minus, ShoppingBag, X, Check, Loader } from "lucide-react";
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
}

interface CartItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

// Category configuration with representative images
const CATEGORY_CONFIG: Record<string, { label: string; image: string; desc: string }> = {
  bowl: {
    label: "Bowls",
    image: "/images/menu/chipotle-crema-bowl.png",
    desc: "Signature protein bowls",
  },
  wrap: {
    label: "Wraps",
    image: "/images/menu/breakfast-burritos-10-500x500.jpg",
    desc: "Handheld perfection",
  },
  salad: {
    label: "Salads",
    image: "/images/menu/lean.png",
    desc: "Fresh & crisp greens",
  },
  side: {
    label: "Sides",
    image: "/images/menu/sauteed-green-beans-s3.jpeg",
    desc: "Complete your meal",
  },
  drink: {
    label: "Drinks",
    image: "/images/menu/screenshot-2026-04-01-at-5.14.45-pm.png",
    desc: "Refresh & hydrate",
  },
  dessert: {
    label: "Desserts",
    image: "/images/menu/cinnamon-protein-bars.png",
    desc: "Guilt-free treats",
  },
  snack: {
    label: "Snacks",
    image: "/images/menu/cinnamon-protein-bars.png",
    desc: "Fuel between meals",
  },
};

export default function MenuBrowser({ recipes }: { recipes: MenuRecipe[] }) {
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuRecipe | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  // Get categories that actually have recipes
  const availableCategories = useMemo(() => {
    const cats = new Set(recipes.map((r) => r.category));
    return Array.from(cats).sort((a, b) => {
      const order = ["bowl", "wrap", "salad", "side", "drink", "dessert", "snack"];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [recipes]);

  // Filtered recipes for selected category
  const categoryRecipes = useMemo(() => {
    if (!selectedCategory) return [];
    return recipes.filter((r) => r.category === selectedCategory);
  }, [recipes, selectedCategory]);

  // Cart helpers
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const addToCart = (recipe: MenuRecipe) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.recipe_id === recipe.id);
      if (existing) {
        return prev.map((i) =>
          i.recipe_id === recipe.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { recipe_id: recipe.id, name: recipe.name, price: recipe.base_price, quantity: 1, image_url: recipe.image_url }];
    });
    setAddedId(recipe.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const updateQuantity = (recipeId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => (i.recipe_id === recipeId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
    });
  };

  const getCartQty = (recipeId: string) => cart.find((i) => i.recipe_id === recipeId)?.quantity || 0;

  // ─── Item Detail View ───
  if (selectedItem) {
    const qty = getCartQty(selectedItem.id);
    return (
      <div className="space-y-0 -mx-4 sm:-mx-6 -mt-5 sm:-mt-6">
        {/* Hero image */}
        <div className="relative w-full aspect-[4/3] bg-[#f2efe8]">
          {selectedItem.image_url ? (
            <Image
              src={selectedItem.image_url}
              alt={selectedItem.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
              {CATEGORY_CONFIG[selectedItem.category]?.label?.[0] || "🍽"}
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f3] via-transparent to-transparent" />
          {/* Back button */}
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition z-10"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 -mt-8 relative z-10 space-y-5 pb-32">
          <div>
            <h1 className="text-2xl font-bold text-[#1e2d18]">{selectedItem.name}</h1>
            <p className="text-lg font-semibold text-[#3d6b2a] mt-1">
              ${selectedItem.base_price.toFixed(2)}
            </p>
          </div>

          {selectedItem.description && (
            <p className="text-sm text-[#7a7060] leading-relaxed">{selectedItem.description}</p>
          )}

          {/* Nutrition info */}
          {(selectedItem.calories || selectedItem.protein_grams) && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Cal", value: selectedItem.calories },
                { label: "Protein", value: selectedItem.protein_grams, unit: "g" },
                { label: "Carbs", value: selectedItem.carb_grams, unit: "g" },
                { label: "Fat", value: selectedItem.fat_grams, unit: "g" },
              ].map(
                (n) =>
                  n.value != null && (
                    <div
                      key={n.label}
                      className="bg-white border border-[#ddd8cc] rounded-xl py-3 text-center"
                    >
                      <p className="text-lg font-bold text-[#1e2d18]">
                        {n.value}
                        {n.unit && <span className="text-xs text-[#9a9080]">{n.unit}</span>}
                      </p>
                      <p className="text-[10px] text-[#9a9080] uppercase font-medium mt-0.5">
                        {n.label}
                      </p>
                    </div>
                  )
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-[#9a9080]">
            {selectedItem.prep_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock size={13} /> {selectedItem.prep_time_minutes} min
              </span>
            )}
            {selectedItem.spice_level != null && selectedItem.spice_level > 0 && (
              <span className="flex items-center gap-1">
                <Flame size={13} className="text-orange-400" />
                {"🌶".repeat(selectedItem.spice_level)}
              </span>
            )}
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {selectedItem.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-[#f2efe8] text-[#7a7060]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Add to Bag */}
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-0 right-0 z-40 px-4 pb-3 pt-3 bg-gradient-to-t from-[#faf8f3] via-[#faf8f3] to-transparent lg:bottom-0">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {qty > 0 && (
              <div className="flex items-center gap-2 bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-1">
                <button
                  onClick={() => updateQuantity(selectedItem.id, -1)}
                  className="w-10 h-10 flex items-center justify-center text-[#7a7060] hover:text-[#1e2d18] transition"
                >
                  <Minus size={16} />
                </button>
                <span className="text-[#1e2d18] font-bold text-sm w-6 text-center">{qty}</span>
                <button
                  onClick={() => updateQuantity(selectedItem.id, 1)}
                  className="w-10 h-10 flex items-center justify-center text-[#7a7060] hover:text-[#1e2d18] transition"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
            <button
              onClick={() => addToCart(selectedItem)}
              className="flex-1 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
            >
              {addedId === selectedItem.id ? (
                <>
                  <Check size={18} /> Added!
                </>
              ) : (
                <>
                  <Plus size={18} /> Add to Bag — ${(selectedItem.base_price * Math.max(1, qty)).toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Category Items List ───
  if (selectedCategory) {
    const config = CATEGORY_CONFIG[selectedCategory];
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="w-9 h-9 rounded-full bg-[#f2efe8] flex items-center justify-center text-[#7a7060] hover:text-[#1e2d18] hover:bg-[#f2efe8] transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1e2d18]">{config?.label || selectedCategory}</h1>
            <p className="text-xs text-[#9a9080]">{categoryRecipes.length} items</p>
          </div>
        </div>

        {/* Items list */}
        <div className="space-y-3">
          {categoryRecipes.map((recipe) => {
            const qty = getCartQty(recipe.id);
            return (
              <button
                key={recipe.id}
                onClick={() => setSelectedItem(recipe)}
                className="w-full flex items-center gap-3.5 bg-white border border-[#ddd8cc] rounded-2xl p-3 hover:bg-[#f0ece3] transition active:bg-[#f0ece3] text-left"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#f2efe8] flex-shrink-0">
                  {recipe.image_url ? (
                    <Image
                      src={recipe.image_url}
                      alt={recipe.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                      {config?.label?.[0] || "🍽"}
                    </div>
                  )}
                  {qty > 0 && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#3d6b2a] flex items-center justify-center text-[10px] font-bold text-white">
                      {qty}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#1e2d18] truncate">{recipe.name}</h3>
                  {recipe.description && (
                    <p className="text-xs text-[#9a9080] line-clamp-2 mt-0.5">{recipe.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-bold text-[#3d6b2a]">
                      ${recipe.base_price.toFixed(2)}
                    </span>
                    {recipe.calories && (
                      <span className="text-[10px] text-[#9a9080]">{recipe.calories} cal</span>
                    )}
                    {recipe.spice_level != null && recipe.spice_level > 0 && (
                      <span className="text-[10px]">{"🌶".repeat(recipe.spice_level)}</span>
                    )}
                  </div>
                </div>

                {/* Quick add */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(recipe);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                    addedId === recipe.id
                      ? "bg-[#3d6b2a] text-white"
                      : "bg-[#f2efe8] text-[#7a7060] hover:bg-[#e9f0e4] hover:text-[#3d6b2a]"
                  }`}
                >
                  {addedId === recipe.id ? <Check size={16} /> : <Plus size={16} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Cart summary floating bar */}
        {cartCount > 0 && (
          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-0 right-0 z-40 px-4 pb-3 lg:bottom-0">
            <Link
              href="/dashboard"
              className="max-w-lg mx-auto flex items-center justify-between bg-[#3d6b2a] text-white font-bold py-3.5 px-5 rounded-xl text-sm shadow-lg shadow-[#3d6b2a]/20 hover:bg-[#2f5720] transition block"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} />
                View Bag ({cartCount})
              </span>
              <span>${cartTotal.toFixed(2)}</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ─── Category Grid (Home) ───
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1e2d18]">Menu</h1>
        <p className="text-sm text-[#9a9080] mt-1">Choose a category to get started</p>
      </div>

      {/* 2-column category grid */}
      <div className="grid grid-cols-2 gap-3">
        {availableCategories.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const count = recipes.filter((r) => r.category === cat).length;
          if (!config) return null;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group text-left active:scale-[0.97] transition-transform"
            >
              {/* Background image */}
              <Image
                src={config.image}
                alt={config.label}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <h3 className="text-base font-bold text-white">{config.label}</h3>
                <p className="text-[11px] text-[#4a5e3a] mt-0.5">
                  {config.desc} · {count} items
                </p>
              </div>
            </button>
          );
        })}

        {/* Build Your Bowl CTA */}
        <Link
          href="/dashboard#bowl-builder"
          className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#3d6b2a]/20 to-[#449531]/20 border border-[#3d6b2a]/20 flex flex-col items-center justify-center text-center active:scale-[0.97] transition-transform group"
        >
          <div className="w-12 h-12 rounded-full bg-[#e9f0e4] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus size={24} className="text-[#3d6b2a]" />
          </div>
          <h3 className="text-base font-bold text-[#1e2d18]">Build Your Bowl</h3>
          <p className="text-[11px] text-[#7a7060] mt-0.5">Customize it your way</p>
        </Link>
      </div>

      {/* Cart summary floating bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-0 right-0 z-40 px-4 pb-3 lg:bottom-0">
          <Link
            href="/dashboard"
            className="max-w-lg mx-auto flex items-center justify-between bg-[#3d6b2a] text-white font-bold py-3.5 px-5 rounded-xl text-sm shadow-lg shadow-[#3d6b2a]/20 hover:bg-[#2f5720] transition block"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} />
              View Bag ({cartCount})
            </span>
            <span>${cartTotal.toFixed(2)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
