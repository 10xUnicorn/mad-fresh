"use client";

import { useState } from "react";
import { Loader2, Check, Copy, Gift } from "lucide-react";

interface RedeemButtonProps {
  tier: string;
  points: number;
  reward: string;
  canRedeem: boolean;
}

export default function RedeemButton({ tier, points, reward, canRedeem }: RedeemButtonProps) {
  const [state, setState] = useState<"idle" | "confirming" | "loading" | "success" | "error">("idle");
  const [promoCode, setPromoCode] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRedeem = async () => {
    if (state === "idle") {
      setState("confirming");
      return;
    }

    if (state === "confirming") {
      setState("loading");
      try {
        const res = await fetch("/api/rewards/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });

        const data = await res.json();
        if (!res.ok) {
          setState("error");
          setMessage(data.error || "Something went wrong");
          setTimeout(() => setState("idle"), 3000);
          return;
        }

        setPromoCode(data.promo_code);
        setMessage(data.message);
        setState("success");
      } catch {
        setState("error");
        setMessage("Network error — please try again");
        setTimeout(() => setState("idle"), 3000);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!canRedeem) {
    return (
      <div className="mt-2 sm:mt-3 text-[10px] text-[#9a9080]">
        Need {points.toLocaleString()} pts
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="mt-2 sm:mt-3 space-y-2">
        <div className="flex items-center justify-center gap-1 text-[#3d6b2a]">
          <Check size={14} />
          <span className="text-xs font-semibold">Redeemed!</span>
        </div>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-1.5 bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#3d6b2a] hover:bg-[#e9f0e4] transition min-h-[36px]"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {promoCode}
        </button>
        <p className="text-[10px] text-[#9a9080] leading-tight">{message}</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-2 sm:mt-3">
        <p className="text-xs text-red-600">{message}</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleRedeem}
      disabled={state === "loading"}
      className={`mt-2 sm:mt-3 w-full text-xs font-semibold px-3 py-2 rounded-full transition min-h-[36px] flex items-center justify-center gap-1.5 ${
        state === "confirming"
          ? "bg-orange-50 text-orange-700 border border-orange-300"
          : "bg-[#3d6b2a] text-white hover:bg-[#2f5720] active:scale-95"
      }`}
    >
      {state === "loading" && <Loader2 size={14} className="animate-spin" />}
      {state === "confirming" && (
        <>Spend {points.toLocaleString()} pts?</>
      )}
      {state === "idle" && (
        <>
          <Gift size={13} /> Redeem
        </>
      )}
      {state === "loading" && "Redeeming..."}
    </button>
  );
}
