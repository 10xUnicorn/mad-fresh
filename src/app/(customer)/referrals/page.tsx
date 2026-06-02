"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gift,
  Copy,
  Share2,
  Check,
  Loader2,
  Users,
  Star,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  pointsEarned: number;
}

interface ReferralEntry {
  id: string;
  referral_code: string;
  status: "pending" | "completed" | "expired";
  referrer_reward_value: number | null;
  created_at: string;
}

interface CodeData {
  suggestions: string[];
  currentCode: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-[#e9f0e4] text-[#3d6b2a] border-[#3d6b2a]/15",
  expired: "bg-[#f2efe8] text-[#9a9080] border-[#ddd8cc]",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  completed: CheckCircle2,
  expired: RefreshCw,
};

export default function ReferralsPage() {
  const [codeData, setCodeData] = useState<CodeData | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const referralLink = selectedCode
    ? `madfresh.app/r/${selectedCode}`
    : null;

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [codeRes, historyRes] = await Promise.all([
        fetch("/api/referrals/code"),
        fetch("/api/referrals"),
      ]);

      if (codeRes.ok) {
        const data: CodeData = await codeRes.json();
        setCodeData(data);
        setSelectedCode(data.currentCode || data.suggestions[0] || null);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        const entries: ReferralEntry[] = data.referrals || [];
        setHistory(entries);
        const completed = entries.filter((r) => r.status === "completed").length;
        const pending = entries.filter((r) => r.status === "pending").length;
        const pointsEarned = entries
          .filter((r) => r.status === "completed")
          .reduce((sum, r) => sum + (r.referrer_reward_value || 500), 0);
        setStats({
          totalReferrals: entries.length,
          completedReferrals: completed,
          pendingReferrals: pending,
          pointsEarned,
        });
      } else {
        setStats({ totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, pointsEarned: 0 });
      }
    } catch {
      setStats({ totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, pointsEarned: 0 });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSaveCode() {
    if (!selectedCode) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/referrals/code", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: selectedCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Failed to save code");
        return;
      }
      setSaved(true);
      setCodeData((prev) => prev ? { ...prev, currentCode: data.code } : prev);
      setSelectedCode(data.code);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(`https://${referralLink}`);
    } catch {
      const input = document.createElement("input");
      input.value = `https://${referralLink}`;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!referralLink || !selectedCode) return;
    if (navigator.share) {
      await navigator.share({
        title: "Mad Fresh Kitchen",
        text: `Use my referral code ${selectedCode} and get 15% off your first order!`,
        url: `https://${referralLink}`,
      });
    } else {
      handleCopy();
    }
  }

  const isCurrentlySaved = codeData?.currentCode === selectedCode;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18] flex items-center gap-2">
          <Gift className="text-[#3d6b2a]" size={26} />
          Referrals
        </h1>
        <p className="text-[#7a7060] text-sm mt-1">
          Share your code · Earn points · Give friends 15% off
        </p>
      </div>

      {/* Reward Explainer */}
      <div className="bg-white border border-[#3d6b2a]/15 rounded-2xl p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#e9f0e4] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={20} className="text-[#3d6b2a]" />
        </div>
        <div>
          <p className="text-[#1e2d18] font-bold text-sm mb-1">How Referrals Work</p>
          <p className="text-[#7a7060] text-xs leading-relaxed">
            When your friends sign up and subscribe using your code,{" "}
            <span className="text-[#3d6b2a] font-semibold">you get 500 points</span> and{" "}
            <span className="text-[#1e2d18] font-semibold">they get 15% off</span> their first order. Win-win.
          </p>
        </div>
      </div>

      {/* Code Picker */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[#1e2d18] font-bold text-sm uppercase tracking-widest">Your Referral Code</p>
          {saved && (
            <span className="text-[#3d6b2a] text-xs font-semibold flex items-center gap-1">
              <Check size={12} /> Saved!
            </span>
          )}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={24} className="animate-spin text-[#9a9080]" />
          </div>
        ) : (
          <>
            {/* Chip Grid */}
            <div className="flex flex-wrap gap-2">
              {(codeData?.suggestions || []).map((code) => {
                const isSelected = selectedCode === code;
                const isSaved = codeData?.currentCode === code;
                return (
                  <button
                    key={code}
                    onClick={() => {
                      setSelectedCode(code);
                      setSaveError(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                      isSelected
                        ? "border-[#3d6b2a] bg-[#e9f0e4] text-[#3d6b2a]"
                        : "border-[#ddd8cc] bg-[#f2efe8] text-[#4a5e3a] hover:border-[#9a9080]"
                    }`}
                  >
                    {code}
                    {isSaved && (
                      <span className="ml-1 text-[10px] text-[#3d6b2a] font-normal">(active)</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Save Button */}
            {!isCurrentlySaved && selectedCode && (
              <button
                onClick={handleSaveCode}
                disabled={saving}
                className="w-full bg-[#e9f0e4] border border-[#3d6b2a]/15 hover:bg-[#dce8d5] text-[#3d6b2a] font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 transition"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>Use &ldquo;{selectedCode}&rdquo; as my code</>
                )}
              </button>
            )}

            {saveError && (
              <p className="text-red-600 text-xs">{saveError}</p>
            )}
          </>
        )}
      </div>

      {/* Share Section */}
      {selectedCode && (
        <div className="bg-white border border-[#ddd8cc] rounded-2xl p-5 space-y-3">
          <p className="text-[#1e2d18] font-bold text-sm uppercase tracking-widest">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-[#f2efe8] border border-[#3d6b2a]/15 rounded-xl px-4 py-3">
              <p className="text-[10px] text-[#9a9080] uppercase tracking-widest mb-0.5">Share this link</p>
              <p className="text-sm text-[#3d6b2a] font-mono font-bold truncate">{referralLink}</p>
            </div>
            <button
              onClick={handleCopy}
              className="p-3 rounded-xl bg-[#f2efe8] hover:bg-[#f0ece3] border border-[#ddd8cc] transition"
            >
              {copied ? (
                <Check size={18} className="text-[#3d6b2a]" />
              ) : (
                <Copy size={18} className="text-[#7a7060]" />
              )}
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-xl bg-[#3d6b2a] hover:bg-[#2f5720] transition"
            >
              <Share2 size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
          <Users size={20} className="text-[#3d6b2a] mx-auto mb-2" />
          <p className="text-2xl font-black text-[#1e2d18]">
            {loadingData ? "—" : stats?.totalReferrals || 0}
          </p>
          <p className="text-xs text-[#9a9080]">Total Referrals</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
          <CheckCircle2 size={20} className="text-[#3d6b2a] mx-auto mb-2" />
          <p className="text-2xl font-black text-[#1e2d18]">
            {loadingData ? "—" : stats?.completedReferrals || 0}
          </p>
          <p className="text-xs text-[#9a9080]">Conversions</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
          <Clock size={20} className="text-[#3d6b2a] mx-auto mb-2" />
          <p className="text-2xl font-black text-[#1e2d18]">
            {loadingData ? "—" : stats?.pendingReferrals || 0}
          </p>
          <p className="text-xs text-[#9a9080]">Pending</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
          <Star size={20} className="text-[#3d6b2a] mx-auto mb-2" />
          <p className="text-2xl font-black text-[#3d6b2a]">
            {loadingData ? "—" : (stats?.pointsEarned || 0).toLocaleString()}
          </p>
          <p className="text-xs text-[#9a9080]">Points Earned</p>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-[#1e2d18] font-bold">Referral History</h2>
        </div>
        {loadingData ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[#9a9080]" />
          </div>
        ) : history.length > 0 ? (
          <div className="divide-y divide-[#ede9e2]">
            {history.map((entry) => {
              const StatusIcon = STATUS_ICONS[entry.status] || Clock;
              return (
                <div key={entry.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-[#1e2d18] font-mono truncate">
                      {entry.referral_code}
                    </p>
                    <p className="text-xs text-[#9a9080] mt-0.5">
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {entry.status === "completed" && entry.referrer_reward_value && (
                      <span className="text-xs text-[#3d6b2a] font-bold">
                        +{entry.referrer_reward_value} pts
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                        STATUS_STYLES[entry.status] || STATUS_STYLES.pending
                      }`}
                    >
                      <StatusIcon size={10} />
                      {entry.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 pb-8 text-center py-8">
            <Gift size={32} className="text-[#9a9080] mx-auto mb-3" />
            <p className="text-[#7a7060] text-sm">No referrals yet</p>
            <p className="text-[#9a9080] text-xs mt-1">
              Share your code to start earning rewards!
            </p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-5">
        <h2 className="text-[#1e2d18] font-bold mb-4">How It Works</h2>
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Pick your code",
              desc: "Choose a fun, personalized referral code above.",
            },
            {
              step: "2",
              title: "Share with friends",
              desc: "Send your link or code via text, social, or word of mouth.",
            },
            {
              step: "3",
              title: "They save, you earn",
              desc: "They get 15% off their first order. You get 500 points instantly.",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#e9f0e4] flex items-center justify-center text-[#3d6b2a] font-bold text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-[#1e2d18] font-semibold text-sm">{item.title}</p>
                <p className="text-[#9a9080] text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
