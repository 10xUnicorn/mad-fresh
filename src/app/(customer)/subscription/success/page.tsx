"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Package, Calendar, Star, XCircle } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch(`/api/subscriptions/checkout?session_id=${sessionId}`);
        const data = await res.json();

        if (data.status === "complete") {
          setStatus("success");
          setEmail(data.customerEmail || "");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    checkSession();
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 size={40} className="text-[#3d6b2a] animate-spin" />
        <p className="text-[#7a7060]">Confirming your subscription...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 text-center space-y-4">
          <XCircle size={48} className="text-red-600 mx-auto" />
          <h1 className="text-2xl font-black text-[#1e2d18]">Something Went Wrong</h1>
          <p className="text-[#7a7060]">
            We couldn&apos;t confirm your subscription. If you were charged, please contact support.
          </p>
          <Link
            href="/subscription"
            className="inline-block mt-4 bg-[#3d6b2a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#2f5720] transition"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white border border-[#3d6b2a]/15 rounded-2xl p-8 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#e9f0e4] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#3d6b2a]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18]">You&apos;re In!</h1>
          <p className="text-[#7a7060] mt-2">
            Your subscription is now active. Fresh, chef-crafted meals are heading your way.
          </p>
        </div>

        {email && (
          <p className="text-xs text-[#9a9080]">
            Confirmation sent to <span className="text-[#3d6b2a]">{email}</span>
          </p>
        )}

        {/* What's next */}
        <div className="space-y-3 text-left">
          <div className="bg-[#f2efe8] rounded-xl p-4 flex items-start gap-3">
            <Package size={18} className="text-[#3d6b2a] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#1e2d18] text-sm font-semibold">Delivery Every Sunday</p>
              <p className="text-[#9a9080] text-xs">Valley-wide delivery. Order cutoff: Friday 12 noon.</p>
            </div>
          </div>
          <div className="bg-[#f2efe8] rounded-xl p-4 flex items-start gap-3">
            <Calendar size={18} className="text-[#3d6b2a] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#1e2d18] text-sm font-semibold">Choose Your Meals</p>
              <p className="text-[#9a9080] text-xs">Head to the menu to pick your meals for this week.</p>
            </div>
          </div>
          <div className="bg-[#f2efe8] rounded-xl p-4 flex items-start gap-3">
            <Star size={18} className="text-[#3d6b2a] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#1e2d18] text-sm font-semibold">Earn Rewards</p>
              <p className="text-[#9a9080] text-xs">Every order earns points. Streak bonuses, referrals, and more.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/order"
          className="block w-full bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-bold py-3.5 rounded-xl transition text-center"
        >
          Choose Your Meals
        </Link>
        <Link
          href="/dashboard"
          className="block w-full bg-[#f2efe8] hover:bg-[#f0ece3] text-[#1e2d18] font-medium py-3.5 rounded-xl transition text-center border border-[#ddd8cc]"
        >
          Go to Dashboard
        </Link>
      </div>

      <p className="text-center text-[#9a9080] text-xs">
        Questions? Contact us at{" "}
        <a href="mailto:order@madfresh.app" className="text-[#3d6b2a] hover:underline">
          order@madfresh.app
        </a>
      </p>
    </div>
  );
}
