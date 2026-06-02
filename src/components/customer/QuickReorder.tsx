"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  RotateCcw, ShoppingBag, Clock, Check, Loader2,
  ChevronRight, Star, Zap, X, Plus, Minus, Edit3,
} from "lucide-react";

interface OrderItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  category: string;
}

interface PastOrder {
  id: string;
  order_number: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

interface FeaturedItem {
  id: string;
  name: string;
  base_price: number;
  image_url: string | null;
  category: string;
  is_featured: boolean;
  badge?: string;
  bonus_points?: number;
}

interface QuickReorderProps {
  lastOrder: PastOrder | null;
  secondLastOrder: PastOrder | null;
  topFavorite: FeaturedItem | null;
  bonusPointItems: FeaturedItem[];
  featuredItems: FeaturedItem[];
}

type ReorderState = "idle" | "holding" | "submitting" | "submitted" | "editing";

export default function QuickReorder({
  lastOrder,
  secondLastOrder,
  topFavorite,
  bonusPointItems,
  featuredItems,
}: QuickReorderProps) {
  const [state, setState] = useState<ReorderState>("idle");
  const [selectedOrder, setSelectedOrder] = useState<PastOrder | null>(null);
  const [editCart, setEditCart] = useState<OrderItem[]>([]);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartRef = useRef<number>(0);
  const [editWindowEnd, setEditWindowEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const editTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasOrders = lastOrder || secondLastOrder;

  // ─── Hold to Reorder ───
  const startHold = useCallback((order: PastOrder) => {
    setSelectedOrder(order);
    setEditCart(order.items.map(i => ({ ...i })));
    holdStartRef.current = Date.now();
    setState("holding");

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min((elapsed / 1500) * 100, 100); // 1.5s hold
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdTimerRef.current!);
        submitReorder(order.items);
      }
    }, 30);
  }, []);

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setHoldProgress(0);
    if (state === "holding") setState("idle");
  }, [state]);

  const submitReorder = async (items: OrderItem[]) => {
    setState("submitting");
    setHoldProgress(100);

    // Add items to cart via localStorage
    const cartItems = items.map(item => ({
      recipe_id: item.recipe_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      fulfillment_type: "pickup" as const,
      category: item.category,
    }));

    localStorage.setItem("cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cart-updated"));

    // Brief success state then show edit window
    setTimeout(() => {
      setState("submitted");
      const endTime = Date.now() + 5 * 60 * 1000; // 5 minutes
      setEditWindowEnd(endTime);

      editTimerRef.current = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(editTimerRef.current!);
          setState("idle");
          setEditWindowEnd(null);
        }
      }, 1000);
    }, 800);
  };

  const startEditing = () => {
    if (selectedOrder) {
      setEditCart(JSON.parse(localStorage.getItem("cart") || "[]"));
      setState("editing");
    }
  };

  const updateEditQty = (recipeId: string, delta: number) => {
    setEditCart(prev =>
      prev.map(i => i.recipe_id === recipeId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const saveEdits = () => {
    localStorage.setItem("cart", JSON.stringify(editCart.map(i => ({
      recipe_id: i.recipe_id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image_url: i.image_url,
      fulfillment_type: "pickup",
      category: i.category,
    }))));
    window.dispatchEvent(new Event("cart-updated"));
    setState("submitted");
  };

  const formatTimeLeft = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!hasOrders && !topFavorite && featuredItems.length === 0) return null;

  // ─── Edit Mode ───
  if (state === "editing") {
    return (
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[#1e2d18] font-bold text-sm flex items-center gap-2">
            <Edit3 size={14} className="text-[#3d6b2a]" /> Edit Your Order
          </h3>
          <button onClick={() => setState("submitted")} className="text-[#9a9080] hover:text-[#1e2d18] transition">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {editCart.map(item => (
            <div key={item.recipe_id} className="flex items-center justify-between bg-white border border-[#ddd8cc] rounded-xl px-3 py-2.5 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#1e2d18] font-medium truncate">{item.name}</p>
                <p className="text-xs text-[#9a9080]">${item.price.toFixed(2)} ea</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateEditQty(item.recipe_id, -1)} className="w-7 h-7 rounded-full bg-[#f2efe8] flex items-center justify-center text-[#7a7060]">
                  <Minus size={12} />
                </button>
                <span className="text-[#1e2d18] font-bold text-sm w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateEditQty(item.recipe_id, 1)} className="w-7 h-7 rounded-full bg-[#f2efe8] flex items-center justify-center text-[#7a7060]">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/order"
            className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-[#3d6b2a] bg-[#e9f0e4] border border-[#3d6b2a]/20 hover:bg-[#e9f0e4] transition"
          >
            + Add Items
          </Link>
          <button
            onClick={saveEdits}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#3d6b2a] hover:bg-[#2f5720] transition active:scale-[0.98]"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // ─── Submitted State (5-min edit window) ───
  if (state === "submitted" && editWindowEnd) {
    return (
      <div className="bg-gradient-to-r from-[#e9f0e4] to-transparent border border-[#3d6b2a]/15 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3d6b2a] flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[#1e2d18] font-bold text-sm">Order added to cart!</p>
              <p className="text-[#7a7060] text-xs">{selectedOrder?.items.length} items · ${selectedOrder?.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9a9080] uppercase tracking-wider">Edit window</p>
            <p className="text-sm font-mono font-bold text-[#3d6b2a]">{formatTimeLeft(timeLeft)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startEditing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-[#1e2d18] bg-[#f2efe8] border border-[#ddd8cc] hover:bg-[#ede9e2] transition"
          >
            <Edit3 size={14} /> Edit Order
          </button>
          <Link
            href="/cart"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#3d6b2a] hover:bg-[#2f5720] transition active:scale-[0.98]"
          >
            <ShoppingBag size={14} /> Checkout
          </Link>
        </div>
      </div>
    );
  }

  // ─── Default: Reorder Cards ───
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold text-[#1e2d18] flex items-center gap-1.5">
          <RotateCcw size={14} className="text-[#3d6b2a]" /> Quick Reorder
        </h2>
        <Link href="/orders" className="text-[11px] text-[#3d6b2a] font-semibold hover:underline flex items-center gap-0.5">
          All Orders <ChevronRight size={11} />
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Last Order */}
        {lastOrder && (
          <ReorderCard
            label="Last Order"
            order={lastOrder}
            state={state}
            holdProgress={holdProgress}
            selectedId={selectedOrder?.id}
            onHoldStart={startHold}
            onHoldEnd={cancelHold}
          />
        )}

        {/* Second-to-last */}
        {secondLastOrder && (
          <ReorderCard
            label="Previous Order"
            order={secondLastOrder}
            state={state}
            holdProgress={holdProgress}
            selectedId={selectedOrder?.id}
            onHoldStart={startHold}
            onHoldEnd={cancelHold}
          />
        )}

        {/* Top Favorite */}
        {topFavorite && (
          <div className="flex-shrink-0 w-[200px] bg-white border border-[#ddd8cc] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Star size={12} className="text-yellow-400" />
              <span className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">Your Favorite</span>
            </div>
            <div className="flex items-center gap-2">
              {topFavorite.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={topFavorite.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#f2efe8] flex items-center justify-center text-sm">🍽</div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1e2d18] truncate">{topFavorite.name}</p>
                <p className="text-[10px] text-[#3d6b2a] font-bold">${topFavorite.base_price.toFixed(2)}</p>
              </div>
            </div>
            <Link
              href="/order"
              className="block text-center py-2 rounded-lg text-[11px] font-semibold text-[#3d6b2a] bg-[#e9f0e4] border border-[#3d6b2a]/15 hover:bg-[#e9f0e4] transition"
            >
              Add to Cart
            </Link>
          </div>
        )}

        {/* Bonus Point Items */}
        {bonusPointItems.slice(0, 2).map(item => (
          <div key={item.id} className="flex-shrink-0 w-[200px] bg-white border border-[#ddd8cc] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-[#3d6b2a]" />
              <span className="text-[10px] font-semibold text-[#3d6b2a] uppercase tracking-wider">+{item.bonus_points} pts</span>
            </div>
            <div className="flex items-center gap-2">
              {item.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#f2efe8] flex items-center justify-center text-sm">🍽</div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1e2d18] truncate">{item.name}</p>
                <p className="text-[10px] text-[#3d6b2a] font-bold">${item.base_price.toFixed(2)}</p>
              </div>
            </div>
            <Link
              href="/order"
              className="block text-center py-2 rounded-lg text-[11px] font-semibold text-[#3d6b2a] bg-[#e9f0e4] border border-[#3d6b2a]/15 hover:bg-[#e9f0e4] transition"
            >
              Order Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reorder Card Sub-component ───
function ReorderCard({
  label,
  order,
  state,
  holdProgress,
  selectedId,
  onHoldStart,
  onHoldEnd,
}: {
  label: string;
  order: PastOrder;
  state: ReorderState;
  holdProgress: number;
  selectedId?: string;
  onHoldStart: (order: PastOrder) => void;
  onHoldEnd: () => void;
}) {
  const isThisHolding = state === "holding" && selectedId === order.id;
  const isSubmitting = state === "submitting" && selectedId === order.id;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemNames = order.items.slice(0, 3).map(i => i.name).join(", ");
  const moreCount = order.items.length > 3 ? order.items.length - 3 : 0;

  return (
    <div className="flex-shrink-0 w-[240px] bg-white border border-[#ddd8cc] rounded-xl p-3 space-y-2.5 relative overflow-hidden">
      {/* Hold progress overlay */}
      {isThisHolding && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-[#3d6b2a] transition-all duration-75 rounded-full"
          style={{ width: `${holdProgress}%` }}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-[#9a9080]" />
          <span className="text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[10px] text-[#9a9080]">
          {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      <div>
        <p className="text-xs text-[#7a7060] line-clamp-2 leading-relaxed">
          {itemNames}{moreCount > 0 && ` +${moreCount} more`}
        </p>
        <p className="text-xs text-[#9a9080] mt-1">{itemCount} items · ${total.toFixed(2)}</p>
      </div>

      <button
        onMouseDown={() => onHoldStart(order)}
        onMouseUp={onHoldEnd}
        onMouseLeave={onHoldEnd}
        onTouchStart={() => onHoldStart(order)}
        onTouchEnd={onHoldEnd}
        disabled={isSubmitting}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none ${
          isSubmitting
            ? "bg-[#e9f0e4] text-[#3d6b2a]"
            : isThisHolding
              ? "bg-[#e9f0e4] text-[#3d6b2a] scale-[0.97]"
              : "bg-[#e9f0e4] text-[#3d6b2a] border border-[#3d6b2a]/15 hover:bg-[#e9f0e4] active:scale-[0.97]"
        }`}
      >
        {isSubmitting ? (
          <><Loader2 size={13} className="animate-spin" /> Adding...</>
        ) : isThisHolding ? (
          <><RotateCcw size={13} /> Hold to Reorder...</>
        ) : (
          <><RotateCcw size={13} /> Hold to Reorder</>
        )}
      </button>
    </div>
  );
}
