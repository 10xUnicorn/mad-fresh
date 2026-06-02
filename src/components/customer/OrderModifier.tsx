"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart, Plus, Minus, Clock, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, ShoppingBag, Sparkles, Star, AlertCircle, ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ── Types ──
interface OrderItem {
  id: string;
  recipe_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_addon?: boolean;
  recipes: {
    id: string;
    name: string;
    image_url: string | null;
    base_price: number;
    category: string;
  } | null;
}

interface MenuItem {
  id: string;
  name: string;
  base_price: number;
  image_url: string | null;
  category: string;
  description: string | null;
  is_featured: boolean;
  calories: number | null;
  protein_g: number | null;
}

interface ModifyStatus {
  orderId: string;
  canModify: boolean;
  deadline: string | null;
  reason?: string;
  currentTip: number;
  currentTotal: number;
  items: OrderItem[];
  fulfillmentType: string;
}

interface AddItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
}

const TIP_PRESETS = [2, 5, 8, 10];

const CATEGORY_EMOJI: Record<string, string> = {
  bowl: "🥘", wrap: "🌯", salad: "🥗", side: "🥦",
  drink: "🥤", dessert: "🍫", snack: "🍪", custom: "⚡",
};

// ── Main Component ──
export default function OrderModifier({ orderId, variant = "full" }: { orderId: string; variant?: "full" | "compact" }) {
  const [status, setStatus] = useState<ModifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tip state
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [tipMode, setTipMode] = useState<"preset" | "custom">("preset");
  const [tipSubmitting, setTipSubmitting] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  // Add items state
  const [showAddItems, setShowAddItems] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addItemsCart, setAddItemsCart] = useState<AddItem[]>([]);
  const [addItemsSubmitting, setAddItemsSubmitting] = useState(false);
  const [addItemsSuccess, setAddItemsSuccess] = useState<string | null>(null);

  // Countdown
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Fetch order modification status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/modify`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
      setTipAmount(data.currentTip || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Countdown timer
  useEffect(() => {
    if (!status?.deadline) return;

    const update = () => {
      const now = new Date();
      const deadline = new Date(status.deadline!);
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Closed");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [status?.deadline]);

  // Fetch menu when add items section opens
  useEffect(() => {
    if (!showAddItems || menuItems.length > 0) return;

    setMenuLoading(true);
    fetch("/api/menu")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMenuItems(data);
      })
      .catch(() => {})
      .finally(() => setMenuLoading(false));
  }, [showAddItems, menuItems.length]);

  // ── Handlers ──

  const handleTipSubmit = async () => {
    const finalTip = tipMode === "custom" ? parseFloat(customTip) || 0 : tipAmount;
    if (finalTip < 0) return;

    setTipSubmitting(true);
    setTipSuccess(false);
    try {
      const res = await fetch(`/api/orders/${orderId}/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_tip", tipAmount: finalTip }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTipSuccess(true);
      setTipAmount(finalTip);
      // Refresh status
      fetchStatus();
      setTimeout(() => setTipSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add tip");
    } finally {
      setTipSubmitting(false);
    }
  };

  const addToItemsCart = (item: MenuItem) => {
    setAddItemsCart(prev => {
      const existing = prev.find(i => i.recipe_id === item.id);
      if (existing) {
        return prev.map(i =>
          i.recipe_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { recipe_id: item.id, name: item.name, price: item.base_price, quantity: 1 }];
    });
  };

  const removeFromItemsCart = (recipeId: string) => {
    setAddItemsCart(prev => {
      const existing = prev.find(i => i.recipe_id === recipeId);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.recipe_id === recipeId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.recipe_id !== recipeId);
    });
  };

  const getCartQty = (recipeId: string) => {
    return addItemsCart.find(i => i.recipe_id === recipeId)?.quantity || 0;
  };

  const addItemsTotal = addItemsCart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleAddItemsSubmit = async () => {
    if (addItemsCart.length === 0) return;

    setAddItemsSubmitting(true);
    setAddItemsSuccess(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_items", items: addItemsCart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAddItemsSuccess(data.message);
      setAddItemsCart([]);
      fetchStatus();
      setTimeout(() => setAddItemsSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add items");
    } finally {
      setAddItemsSubmitting(false);
    }
  };

  // ── Derived data ──

  // Get recommended items: items from the same categories the customer ordered, plus featured
  const orderedCategories = status?.items
    ?.map(i => i.recipes?.category)
    .filter(Boolean) as string[] || [];

  const recommendedItems = menuItems.filter(item => {
    const alreadyOrdered = status?.items?.some(oi => oi.recipe_id === item.id);
    if (alreadyOrdered) return false;
    return item.is_featured || orderedCategories.includes(item.category);
  }).slice(0, 6);

  const filteredMenu = selectedCategory === "all"
    ? menuItems
    : menuItems.filter(i => i.category === selectedCategory);

  const categories = [...new Set(menuItems.map(i => i.category))];

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#3d6b2a]" />
      </div>
    );
  }

  if (!status?.canModify) {
    return null; // Don't render anything if modification window is closed
  }

  return (
    <div className="space-y-4">
      {/* Modification Window Banner */}
      {timeRemaining && timeRemaining !== "Closed" && (
        <div className="bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <Clock size={16} className="text-[#3d6b2a] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[#1e2d18] text-sm font-medium">You can still modify this order</p>
            <p className="text-[#7a7060] text-xs">{timeRemaining} to add tips or items</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700 ml-auto text-xs">Dismiss</button>
        </div>
      )}

      {/* ═══ TIP SECTION ═══ */}
      <div className="bg-white border border-[#ddd8cc] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-[#3d6b2a]" />
          <h3 className="text-[#1e2d18] font-bold text-sm">
            {status.currentTip > 0 ? "Update Your Tip" : "Leave a Tip"}
          </h3>
          {tipSuccess && (
            <span className="ml-auto flex items-center gap-1 text-[#3d6b2a] text-xs font-medium">
              <CheckCircle2 size={14} /> Saved!
            </span>
          )}
        </div>

        <p className="text-[#7a7060] text-xs">Show love to the team that crafted your meals.</p>

        {/* Preset Tips */}
        <div className="grid grid-cols-4 gap-2">
          {TIP_PRESETS.map(amount => (
            <button
              key={amount}
              onClick={() => { setTipAmount(amount); setTipMode("preset"); }}
              className={`py-2.5 rounded-lg text-sm font-bold transition ${
                tipMode === "preset" && tipAmount === amount
                  ? "bg-[#3d6b2a] text-white"
                  : "bg-[#f2efe8] hover:bg-[#f2efe8] text-[#1e2d18] border border-[#ddd8cc]"
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>

        {/* Custom Tip */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060] text-sm">$</span>
            <input
              type="number"
              placeholder="Custom"
              value={customTip}
              onChange={(e) => { setCustomTip(e.target.value); setTipMode("custom"); }}
              onFocus={() => setTipMode("custom")}
              min="0"
              step="0.01"
              className="w-full pl-7 pr-3 py-2.5 bg-[#f2efe8] border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:border-[#3d6b2a]/50"
            />
          </div>
          <button
            onClick={handleTipSubmit}
            disabled={tipSubmitting || ((tipMode === "custom" ? (parseFloat(customTip) || 0) : tipAmount) === status.currentTip)}
            className="px-5 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-bold text-sm rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {tipSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {status.currentTip > 0 ? "Update" : "Add Tip"}
          </button>
        </div>
      </div>

      {/* ═══ ADD ITEMS SECTION ═══ */}
      <div className="bg-white border border-[#ddd8cc] rounded-xl overflow-hidden">
        {/* Toggle Header */}
        <button
          onClick={() => setShowAddItems(!showAddItems)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f0ece3] transition"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#3d6b2a]" />
            <h3 className="text-[#1e2d18] font-bold text-sm">Add More Items</h3>
            {addItemsCart.length > 0 && (
              <span className="bg-[#3d6b2a] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {addItemsCart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          {showAddItems ? <ChevronUp size={18} className="text-[#7a7060]" /> : <ChevronDown size={18} className="text-[#7a7060]" />}
        </button>

        {showAddItems && (
          <div className="px-5 pb-5 space-y-4 border-t border-[#ddd8cc]">

            {/* ── Quick Add: Items from this order ── */}
            {status.items && status.items.length > 0 && (
              <div className="pt-4 space-y-2">
                <p className="text-[#7a7060] text-xs font-medium uppercase tracking-wider">Quick Add from Your Order</p>
                <div className="grid gap-2">
                  {status.items
                    .filter((item, idx, arr) => arr.findIndex(i => i.recipe_id === item.recipe_id) === idx)
                    .map(item => {
                      const recipe = item.recipes;
                      if (!recipe) return null;
                      const qty = getCartQty(recipe.id);
                      return (
                        <div key={item.id} className="flex items-center gap-3 bg-white border border-[#ddd8cc] rounded-lg p-2.5">
                          {recipe.image_url ? (
                            <img src={recipe.image_url} alt="" className="w-10 h-10 rounded-md object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-[#f2efe8] flex items-center justify-center text-lg">
                              {CATEGORY_EMOJI[recipe.category] || "🍽️"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[#1e2d18] text-sm font-medium truncate">{recipe.name}</p>
                            <p className="text-[#9a9080] text-xs">${recipe.base_price.toFixed(2)}</p>
                          </div>
                          {qty > 0 ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => removeFromItemsCart(recipe.id)} className="w-7 h-7 rounded-md bg-[#f2efe8] flex items-center justify-center text-[#1e2d18] hover:bg-[#ede9e2] transition">
                                <Minus size={12} />
                              </button>
                              <span className="text-[#1e2d18] text-sm font-bold w-4 text-center">{qty}</span>
                              <button onClick={() => addToItemsCart({ id: recipe.id, name: recipe.name, base_price: recipe.base_price, image_url: recipe.image_url, category: recipe.category, description: null, is_featured: false, calories: null, protein_g: null })} className="w-7 h-7 rounded-md bg-[#3d6b2a] flex items-center justify-center text-white hover:bg-[#2f5720] transition">
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToItemsCart({ id: recipe.id, name: recipe.name, base_price: recipe.base_price, image_url: recipe.image_url, category: recipe.category, description: null, is_featured: false, calories: null, protein_g: null })}
                              className="px-3 py-1.5 bg-[#f2efe8] hover:bg-[#ede9e2] text-[#1e2d18] text-xs font-semibold rounded-md transition"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── Recommended Items ── */}
            {recommendedItems.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#3d6b2a]" />
                  <p className="text-[#7a7060] text-xs font-medium uppercase tracking-wider">Recommended for You</p>
                </div>
                <div className="grid gap-2">
                  {recommendedItems.map(item => {
                    const qty = getCartQty(item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-white border border-[#ddd8cc] rounded-lg p-2.5">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-10 h-10 rounded-md object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-[#f2efe8] flex items-center justify-center text-lg">
                            {CATEGORY_EMOJI[item.category] || "🍽️"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[#1e2d18] text-sm font-medium truncate">{item.name}</p>
                            {item.is_featured && <Star size={10} className="text-yellow-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[#9a9080] text-xs">
                            ${item.base_price.toFixed(2)}
                            {item.calories ? ` · ${item.calories} cal` : ""}
                          </p>
                        </div>
                        {qty > 0 ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromItemsCart(item.id)} className="w-7 h-7 rounded-md bg-[#f2efe8] flex items-center justify-center text-[#1e2d18] hover:bg-[#ede9e2] transition">
                              <Minus size={12} />
                            </button>
                            <span className="text-[#1e2d18] text-sm font-bold w-4 text-center">{qty}</span>
                            <button onClick={() => addToItemsCart(item)} className="w-7 h-7 rounded-md bg-[#3d6b2a] flex items-center justify-center text-white hover:bg-[#2f5720] transition">
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToItemsCart(item)}
                            className="px-3 py-1.5 bg-[#f2efe8] hover:bg-[#ede9e2] text-[#1e2d18] text-xs font-semibold rounded-md transition"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Compact Menu ── */}
            <div className="pt-2 space-y-3">
              <p className="text-[#7a7060] text-xs font-medium uppercase tracking-wider">Full Menu</p>

              {/* Category Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === "all" ? "bg-[#3d6b2a] text-white" : "bg-[#f2efe8] text-[#7a7060] hover:bg-[#f2efe8]"
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                      selectedCategory === cat ? "bg-[#3d6b2a] text-white" : "bg-[#f2efe8] text-[#7a7060] hover:bg-[#f2efe8]"
                    }`}
                  >
                    {CATEGORY_EMOJI[cat] || ""} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              {menuLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-[#7a7060]" />
                </div>
              ) : (
                <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredMenu.map(item => {
                    const qty = getCartQty(item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-3 bg-white border border-[#ddd8cc] hover:bg-[#f0ece3] rounded-lg p-2 transition">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-9 h-9 rounded-md object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-[#f2efe8] flex items-center justify-center text-sm">
                            {CATEGORY_EMOJI[item.category] || "🍽️"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[#1e2d18] text-xs font-medium truncate">{item.name}</p>
                          <p className="text-[#9a9080] text-[10px]">${item.base_price.toFixed(2)}</p>
                        </div>
                        {qty > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => removeFromItemsCart(item.id)} className="w-6 h-6 rounded bg-[#f2efe8] flex items-center justify-center text-[#1e2d18] hover:bg-[#ede9e2] transition">
                              <Minus size={10} />
                            </button>
                            <span className="text-[#1e2d18] text-xs font-bold w-3 text-center">{qty}</span>
                            <button onClick={() => addToItemsCart(item)} className="w-6 h-6 rounded bg-[#3d6b2a] flex items-center justify-center text-white hover:bg-[#2f5720] transition">
                              <Plus size={10} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToItemsCart(item)}
                            className="w-6 h-6 rounded bg-[#f2efe8] hover:bg-[#ede9e2] flex items-center justify-center text-[#1e2d18] transition"
                          >
                            <Plus size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Browse Full Menu Link */}
              <Link
                href="/order"
                className="flex items-center justify-center gap-2 text-[#3d6b2a] text-xs font-semibold hover:underline py-2"
              >
                Browse Full Menu <ExternalLink size={12} />
              </Link>
            </div>

            {/* ── Cart Summary + Submit ── */}
            {addItemsCart.length > 0 && (
              <div className="bg-[#f2efe8] border border-[#ddd8cc] rounded-xl p-4 space-y-3">
                <div className="space-y-1.5">
                  {addItemsCart.map(item => (
                    <div key={item.recipe_id} className="flex justify-between text-xs">
                      <span className="text-[#4a5e3a]">{item.quantity}x {item.name}</span>
                      <span className="text-[#1e2d18]">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-[#ddd8cc]">
                  <span className="text-[#1e2d18] text-sm font-bold">Additional Total</span>
                  <span className="text-[#3d6b2a] text-sm font-bold">${addItemsTotal.toFixed(2)} + tax</span>
                </div>

                {addItemsSuccess && (
                  <div className="flex items-center gap-2 text-[#3d6b2a] text-xs">
                    <CheckCircle2 size={14} /> {addItemsSuccess}
                  </div>
                )}

                <button
                  onClick={handleAddItemsSubmit}
                  disabled={addItemsSubmitting}
                  className="w-full py-3 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-bold text-sm rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addItemsSubmitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Processing...</>
                  ) : (
                    <>Add {addItemsCart.reduce((s, i) => s + i.quantity, 0)} Item(s) · ${addItemsTotal.toFixed(2)}</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
