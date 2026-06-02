"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, RefreshCw, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface CartItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  fulfillment_type: "pickup" | "delivery";
  category: string;
  portion_size?: string;
}

interface UpsellItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  emoji?: string;
}

const DEFAULT_TAX_RATE = 0.085;
const DEFAULT_DELIVERY_FEE = 5.99;
const DEFAULT_FREE_DELIVERY_MIN = 40;

const UPSELLS: UpsellItem[] = [
  { id: "fresh-juice", name: "Fresh Juice", price: 4.99, description: "Cold-pressed OJ", emoji: "🧃" },
  { id: "protein-cookie", name: "Protein Cookie", price: 3.49, description: "Choco-chip", emoji: "🍪" },
  { id: "side-salad", name: "Side Salad", price: 5.99, description: "Mixed greens", emoji: "🥗" },
];

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [freeDeliveryMin, setFreeDeliveryMin] = useState(DEFAULT_FREE_DELIVERY_MIN);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try { setCart(JSON.parse(storedCart)); } catch { setCart([]); }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/checkout")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        if (typeof data.tax_rate === "number") setTaxRate(data.tax_rate);
        if (typeof data.delivery_fee === "number") setDeliveryFee(data.delivery_fee);
        if (typeof data.free_delivery_minimum === "number") setFreeDeliveryMin(data.free_delivery_minimum);
      })
      .catch(() => {
        // Keep defaults on network error
      });
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (newCart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(newCart));
    } else {
      localStorage.removeItem("cart");
    }
    window.dispatchEvent(new Event("cart-updated"));
  };

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-[#faf8f3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3d6b2a]/30 border-t-[#3d6b2a] rounded-full animate-spin" />
      </main>
    );
  }

  const itemsSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasDelivery = cart.some(item => item.fulfillment_type === "delivery");
  const appliedDeliveryFee = hasDelivery && itemsSubtotal < freeDeliveryMin ? deliveryFee : 0;
  const freeDeliveryRemaining = hasDelivery ? Math.max(0, freeDeliveryMin - itemsSubtotal) : 0;
  const taxAmount = itemsSubtotal * taxRate;
  const totalAmount = itemsSubtotal + appliedDeliveryFee + taxAmount;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = (recipeId: string, fulfillmentType: string, portionSize: string | undefined, delta: number) => {
    const updatedCart = cart.map(item => {
      if (item.recipe_id === recipeId && item.fulfillment_type === fulfillmentType && item.portion_size === portionSize) {
        const newQty = item.quantity + delta;
        return newQty <= 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[];
    updateCart(updatedCart);
  };

  const handleRemoveItem = (recipeId: string, fulfillmentType: string, portionSize: string | undefined) => {
    updateCart(cart.filter(item =>
      !(item.recipe_id === recipeId && item.fulfillment_type === fulfillmentType && item.portion_size === portionSize)
    ));
  };

  const handleAddUpsell = (upsell: UpsellItem) => {
    const existing = cart.find(item => item.recipe_id === upsell.id && item.fulfillment_type === "pickup");
    if (existing) {
      updateCart(cart.map(item =>
        item.recipe_id === upsell.id && item.fulfillment_type === "pickup"
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      updateCart([...cart, {
        recipe_id: upsell.id,
        name: upsell.name,
        price: upsell.price,
        quantity: 1,
        fulfillment_type: "pickup" as const,
        category: "addon",
      }]);
    }
  };

  // Empty cart
  if (cart.length === 0) {
    return (
      <main className="min-h-dvh bg-[#faf8f3] flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#f2efe8] border border-[#ddd8cc] flex items-center justify-center mx-auto">
            <ShoppingBag size={28} className="text-[#9a9080]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[#1e2d18]">Your bag is empty</h1>
            <p className="text-[#9a9080] text-sm">Add some meals to get started.</p>
          </div>
          <Link
            href="/menu"
            className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm"
          >
            Browse Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#faf8f3] pb-36">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 sm:pt-4">
        {/* Back link */}
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-sm text-[#9a9080] hover:text-[#3d6b2a] transition font-medium py-2"
        >
          <ArrowLeft size={16} />
          Menu
        </Link>

        {/* Header */}
        <div className="mt-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18]">Your Bag</h1>
          <p className="text-sm text-[#9a9080] mt-0.5">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
        </div>

        {/* Free delivery progress */}
        {hasDelivery && freeDeliveryRemaining > 0 && (
          <div className="mb-5 bg-white border border-[#ddd8cc] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#7a7060]">
                Add <span className="text-[#3d6b2a] font-bold">${freeDeliveryRemaining.toFixed(2)}</span> for free delivery
              </p>
              <p className="text-[10px] text-[#9a9080]">Min ${freeDeliveryMin}</p>
            </div>
            <div className="w-full h-1.5 bg-[#f2efe8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#449531] to-[#3d6b2a] rounded-full transition-all duration-300"
                style={{ width: `${Math.min((itemsSubtotal / freeDeliveryMin) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-3 space-y-3">
            {cart.map((item) => (
              <div
                key={`${item.recipe_id}-${item.fulfillment_type}-${item.portion_size || "default"}`}
                className="bg-white border border-[#ddd8cc] rounded-xl p-4 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1e2d18] truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#9a9080] capitalize">
                          {item.fulfillment_type === "pickup" ? "Pickup" : "Delivery"}
                        </span>
                        {item.portion_size && (
                          <>
                            <span className="text-[11px] text-[#9a9080]">·</span>
                            <span className="text-[11px] text-[#9a9080]">{item.portion_size}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.recipe_id, item.fulfillment_type, item.portion_size)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[#9a9080] hover:text-red-400 transition shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-0 bg-[#f2efe8] border border-[#ddd8cc] rounded-full">
                      <button
                        onClick={() => handleUpdateQuantity(item.recipe_id, item.fulfillment_type, item.portion_size, -1)}
                        className="w-9 h-9 flex items-center justify-center text-[#1e2d18] hover:bg-[#f0ece3] rounded-l-full transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-[#1e2d18] tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.recipe_id, item.fulfillment_type, item.portion_size, 1)}
                        className="w-9 h-9 flex items-center justify-center text-[#1e2d18] hover:bg-[#f0ece3] rounded-r-full transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#1e2d18]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Meal plan CTA */}
            {cartCount >= 3 && (
              <div className="bg-gradient-to-r from-[#449531]/12 to-[#3d6b2a]/8 border border-[#3d6b2a]/15 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <RefreshCw size={18} className="text-[#3d6b2a] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[#1e2d18] font-semibold text-sm">Get this every week?</p>
                    <p className="text-[#9a9080] text-xs">Save 15% with a meal plan</p>
                  </div>
                </div>
                <Link href="/subscription" className="shrink-0 text-xs text-[#3d6b2a] font-bold hover:underline flex items-center gap-0.5">
                  See Plans <ChevronRight size={12} />
                </Link>
              </div>
            )}

            {/* Upsells */}
            <div className="pt-4">
              <h2 className="text-sm font-bold text-[#7a7060] mb-3 uppercase tracking-wider">Complete Your Meal</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {UPSELLS.map((upsell) => (
                  <button
                    key={upsell.id}
                    onClick={() => handleAddUpsell(upsell)}
                    className="shrink-0 w-[140px] bg-white border border-[#ddd8cc] rounded-xl p-3 text-left hover:border-[#3d6b2a]/20 transition group"
                  >
                    <span className="text-2xl block mb-2">{upsell.emoji}</span>
                    <p className="text-xs font-bold text-[#1e2d18]">{upsell.name}</p>
                    <p className="text-[10px] text-[#9a9080] mt-0.5">{upsell.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-[#3d6b2a]">${upsell.price.toFixed(2)}</span>
                      <span className="w-6 h-6 rounded-full bg-[#f2efe8] flex items-center justify-center group-hover:bg-[#3d6b2a] transition">
                        <Plus size={12} className="text-[#7a7060] group-hover:text-[#1e2d18] transition" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Order Summary */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="bg-white border border-[#ddd8cc] rounded-xl p-5 sticky top-20 space-y-4">
              <h2 className="text-base font-bold text-[#1e2d18]">Order Summary</h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9a9080]">Subtotal</span>
                  <span className="text-[#1e2d18] font-medium">${itemsSubtotal.toFixed(2)}</span>
                </div>
                {hasDelivery && (
                  <div className="flex justify-between">
                    <span className="text-[#9a9080]">Delivery</span>
                    <span className={appliedDeliveryFee === 0 ? "text-[#3d6b2a] font-medium" : "text-[#1e2d18] font-medium"}>
                      {appliedDeliveryFee === 0 ? "FREE" : `$${appliedDeliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#9a9080]">Tax</span>
                  <span className="text-[#1e2d18] font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-[#ddd8cc] pt-3 flex justify-between items-center">
                <span className="text-[#1e2d18] font-semibold">Total</span>
                <span className="text-xl font-black text-[#3d6b2a]">${totalAmount.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors w-full font-bold py-3.5 rounded-full text-center flex items-center justify-center gap-2 text-sm"
              >
                Checkout
              </Link>

              <Link
                href="/menu"
                className="text-center text-xs text-[#9a9080] hover:text-[#3d6b2a] transition py-2 flex items-center justify-center"
              >
                Add more items
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom checkout bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf8f3]/98 backdrop-blur-lg border-t border-[#ddd8cc] safe-area-padding">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#9a9080]">Total</p>
            <p className="text-lg font-black text-[#1e2d18]">${totalAmount.toFixed(2)}</p>
          </div>
          <Link
            href="/checkout"
            className="bg-[#3d6b2a] hover:bg-[#5aaa3c] text-white font-bold rounded-full transition-colors flex-1 max-w-[200px] font-bold py-3 rounded-full text-center text-sm"
          >
            Checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
