"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

interface RewardsClientProps {
  referralCode: string;
}

export default function RewardsClient({ referralCode }: RewardsClientProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://madfresh.app/r/${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Mad Fresh Kitchen",
        text: `Use my referral code ${referralCode} and get 15% off your first order!`,
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 min-w-0 bg-[#f2efe8] border border-[#3d6b2a]/20 rounded-xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-[#9a9080] uppercase tracking-widest">Your Referral Link</p>
          <p className="text-xs sm:text-sm text-[#3d6b2a] font-mono font-bold truncate">{referralLink}</p>
        </div>
        <button onClick={handleCopy} className="p-1.5 sm:p-2 rounded-lg hover:bg-[#f2efe8] transition flex-shrink-0">
          {copied ? <Check size={14} className="text-[#3d6b2a]" /> : <Copy size={14} className="text-[#7a7060]" />}
        </button>
      </div>
      <button onClick={handleShare} className="p-2.5 sm:p-3 bg-[#3d6b2a] rounded-xl hover:bg-[#2f5720] transition flex-shrink-0">
        <Share2 size={16} className="text-white" />
      </button>
    </div>
  );
}
