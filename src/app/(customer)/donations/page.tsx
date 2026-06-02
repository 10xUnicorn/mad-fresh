"use client";

import { useState, useEffect } from "react";
import { Heart, Users, Utensils, CheckCircle, Loader2, ChevronRight } from "lucide-react";

const PRESETS = [
  { amount: 10, meals: 1, label: "$10", sublabel: "1 Meal" },
  { amount: 50, meals: 5, label: "$50", sublabel: "5 Meals" },
  { amount: 250, meals: 25, label: "$250", sublabel: "25 Meals" },
  { amount: 1500, meals: 150, label: "$1,500", sublabel: "150 Meals" },
];

interface Stats {
  totalMeals: number;
  totalDonors: number;
  totalAmount: number;
}

export default function DonationsPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = customAmount
    ? parseFloat(customAmount)
    : selectedAmount;

  const mealsCount = effectiveAmount
    ? Math.floor(effectiveAmount / 10)
    : 0;

  useEffect(() => {
    fetch("/api/donations")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => null);
  }, []);

  async function handleDonate() {
    if (!effectiveAmount || effectiveAmount < 1) {
      setError("Please enter a valid donation amount.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          message: message || null,
          isAnonymous,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // In production: use Stripe.js to confirm the payment with data.clientSecret
      // For now we mark success to show the thank-you state
      setDone(true);
      // Optimistically update stats
      setStats((prev) =>
        prev
          ? {
              totalMeals: prev.totalMeals + (data.mealsEquivalent || 0),
              totalDonors: prev.totalDonors + 1,
              totalAmount: prev.totalAmount + effectiveAmount,
            }
          : prev
      );
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6 py-16">
        {/* Animated thank-you */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#e9f0e4] flex items-center justify-center animate-pulse">
            <Heart size={44} className="text-[#3d6b2a] fill-[#3d6b2a]" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#3d6b2a] flex items-center justify-center">
            <CheckCircle size={18} className="text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black text-[#1e2d18] mb-2">Thank You!</h2>
          <p className="text-[#7a7060] text-lg max-w-sm mx-auto leading-relaxed">
            Your{" "}
            <span className="text-[#3d6b2a] font-bold">
              ${effectiveAmount?.toFixed(2)}
            </span>{" "}
            donation will sponsor{" "}
            <span className="text-[#1e2d18] font-bold">{mealsCount} meal{mealsCount !== 1 ? "s" : ""}</span>{" "}
            for someone who needs it.
          </p>
        </div>

        <div className="bg-white border border-[#3d6b2a]/20 rounded-2xl px-8 py-5 max-w-xs w-full">
          <p className="text-xs text-[#9a9080] uppercase tracking-widest mb-1">Community Impact</p>
          <p className="text-4xl font-black text-[#3d6b2a]">
            {(stats?.totalMeals || 0).toLocaleString()}
          </p>
          <p className="text-sm text-[#7a7060]">total meals donated</p>
        </div>

        <button
          onClick={() => {
            setDone(false);
            setSelectedAmount(25);
            setCustomAmount("");
            setMessage("");
          }}
          className="text-[#3d6b2a] text-sm font-semibold hover:underline flex items-center gap-1"
        >
          Donate Again <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e9f0e4] mb-4">
          <Heart size={32} className="text-[#3d6b2a] fill-[#3d6b2a]/30" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1e2d18] leading-tight">
          Give a Meal,<br />
          <span className="text-[#3d6b2a]">Change a Day</span>
        </h1>
        <p className="text-[#7a7060] mt-3 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          Help us feed our community. Every dollar goes directly to sponsoring
          fresh, hot meals for people who need them most.
        </p>
      </div>

      {/* Community Impact Counter */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#ddd8cc] rounded-xl p-3 text-center">
            <Utensils size={16} className="text-[#3d6b2a] mx-auto mb-1" />
            <p className="text-xl font-black text-[#1e2d18]">{stats.totalMeals.toLocaleString()}</p>
            <p className="text-[10px] text-[#9a9080] uppercase tracking-wide leading-tight">Meals Donated</p>
          </div>
          <div className="bg-white border border-[#ddd8cc] rounded-xl p-3 text-center">
            <Users size={16} className="text-[#3d6b2a] mx-auto mb-1" />
            <p className="text-xl font-black text-[#1e2d18]">{stats.totalDonors.toLocaleString()}</p>
            <p className="text-[10px] text-[#9a9080] uppercase tracking-wide leading-tight">Donors</p>
          </div>
          <div className="bg-white border border-[#ddd8cc] rounded-xl p-3 text-center">
            <Heart size={16} className="text-[#3d6b2a] mx-auto mb-1" />
            <p className="text-xl font-black text-[#1e2d18]">${stats.totalAmount.toLocaleString()}</p>
            <p className="text-[10px] text-[#9a9080] uppercase tracking-wide leading-tight">Total Raised</p>
          </div>
        </div>
      )}

      {/* Preset Amounts */}
      <div>
        <p className="text-[#1e2d18] font-bold mb-3 text-sm uppercase tracking-widest">Choose an Amount</p>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((preset) => {
            const isActive = selectedAmount === preset.amount && !customAmount;
            return (
              <button
                key={preset.amount}
                onClick={() => {
                  setSelectedAmount(preset.amount);
                  setCustomAmount("");
                  setError(null);
                }}
                className={`relative rounded-2xl p-5 text-left border-2 transition-all active:scale-[0.97] min-h-[80px] ${
                  isActive
                    ? "border-[#3d6b2a] bg-[#e9f0e4]"
                    : "border-[#ddd8cc] bg-white hover:border-[#b0a898]"
                }`}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#3d6b2a] flex items-center justify-center">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
                <p className={`text-2xl font-black ${isActive ? "text-[#3d6b2a]" : "text-[#1e2d18]"}`}>
                  {preset.label}
                </p>
                <p className="text-xs text-[#7a7060] mt-0.5 flex items-center gap-1">
                  <Utensils size={10} className="text-[#3d6b2a]" />
                  {preset.sublabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <p className="text-[#1e2d18] font-bold mb-2 text-sm uppercase tracking-widest">Or Enter Custom Amount</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7060] font-bold text-lg">$</span>
          <input
            type="number"
            min="1"
            step="1"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
              setError(null);
            }}
            placeholder="0"
            className="w-full bg-white border border-[#ddd8cc] focus:border-[#3d6b2a]/50 outline-none rounded-xl px-4 pl-9 py-3.5 text-[#1e2d18] text-lg font-bold placeholder:text-[#9a9080] transition"
          />
        </div>
        {mealsCount > 0 && (
          <p className="text-xs text-[#3d6b2a] mt-2 flex items-center gap-1">
            <Utensils size={11} />
            This will sponsor <span className="font-bold">{mealsCount} meal{mealsCount !== 1 ? "s" : ""}</span>
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <p className="text-[#1e2d18] font-bold mb-2 text-sm uppercase tracking-widest">
          Add a Message{" "}
          <span className="text-[#9a9080] normal-case font-normal text-xs">(optional)</span>
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave an encouraging note for our kitchen team..."
          rows={3}
          maxLength={200}
          className="w-full bg-white border border-[#ddd8cc] focus:border-[#3d6b2a]/50 outline-none rounded-xl px-4 py-3 text-[#1e2d18] placeholder:text-[#9a9080] resize-none text-sm transition"
        />
        <p className="text-xs text-[#9a9080] text-right mt-1">{message.length}/200</p>
      </div>

      {/* Anonymous Toggle */}
      <div className="flex items-center justify-between bg-white border border-[#ddd8cc] rounded-xl px-4 py-3.5">
        <div>
          <p className="text-[#1e2d18] text-sm font-semibold">Donate Anonymously</p>
          <p className="text-[#9a9080] text-xs mt-0.5">Your name won't be shown publicly</p>
        </div>
        <button
          onClick={() => setIsAnonymous((v) => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isAnonymous ? "bg-[#3d6b2a]" : "bg-[#ddd8cc]"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              isAnonymous ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Donate Button */}
      <button
        onClick={handleDonate}
        disabled={loading || !effectiveAmount || effectiveAmount < 1}
        className="w-full bg-[#3d6b2a] hover:bg-[#2f5720] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl py-4 flex items-center justify-center gap-2 transition active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Heart size={20} className="fill-white" />
            Donate{effectiveAmount ? ` $${effectiveAmount % 1 === 0 ? effectiveAmount : effectiveAmount.toFixed(2)}` : ""}
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#9a9080]">
        Powered by Stripe · Secure payment · 100% goes to meals
      </p>
    </div>
  );
}
