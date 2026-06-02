import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Star, Gift, Flame, ShoppingBag, Heart, MessageSquare, Cake,
  Sparkles, TrendingUp, TrendingDown, Trophy, Users, Utensils, Crown,
} from "lucide-react";
import RewardsClient from "@/components/customer/RewardsClient";
import RedeemButton from "@/components/customer/RedeemButton";
import CollapsibleSection from "@/components/customer/CollapsibleSection";

export const metadata = { title: "Rewards | Mad Fresh Kitchen" };

const EARN_TABLE = [
  { action: "Place an order", points: "10 pts / $1 spent", icon: ShoppingBag },
  { action: "4-week streak bonus", points: "+100 pts", icon: Flame },
  { action: "8-week streak bonus", points: "+250 pts", icon: Flame },
  { action: "12-week streak bonus", points: "+500 pts", icon: Flame },
  { action: "Refer a friend", points: "+500 pts", icon: Gift },
  { action: "Donate a meal", points: "1 pt / $1 donated", icon: Heart },
  { action: "Leave a review", points: "+50 pts", icon: MessageSquare },
  { action: "Birthday bonus", points: "+200 pts", icon: Cake },
];

const REDEEM_TABLE = [
  { tier: "5_off", reward: "$5 off your order", points: 500 },
  { tier: "free_meal", reward: "Free meal", points: 1000 },
  { tier: "free_week", reward: "Free week of meals", points: 2000 },
  { tier: "merch_pack", reward: "Mad Fresh merch pack", points: 5000 },
];

const ALL_ACHIEVEMENTS = [
  { key: "first_bite", title: "First Bite", desc: "Place your first order", icon: ShoppingBag, color: "text-green-400", bg: "bg-green-500/20" },
  { key: "streak_2", title: "Streak Starter", desc: "2 consecutive weeks", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/20" },
  { key: "streak_4", title: "On Fire", desc: "4-week streak", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/20" },
  { key: "streak_12", title: "Unstoppable", desc: "12-week streak", icon: Flame, color: "text-red-400", bg: "bg-red-500/20" },
  { key: "streak_52", title: "Year of Fresh", desc: "52-week streak", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  { key: "referral_1", title: "Connector", desc: "First referral", icon: Gift, color: "text-purple-400", bg: "bg-purple-500/20" },
  { key: "referral_5", title: "Networker", desc: "5 referrals", icon: Users, color: "text-purple-400", bg: "bg-purple-500/20" },
  { key: "referral_10", title: "Ambassador", desc: "10 referrals", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  { key: "donated_10", title: "Generous Soul", desc: "Donate 10 meals", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/20" },
  { key: "donated_50", title: "Meal Hero", desc: "Donate 50 meals", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/20" },
  { key: "explorer_10", title: "Explorer", desc: "Try 10 different recipes", icon: Utensils, color: "text-blue-400", bg: "bg-blue-500/20" },
  { key: "all_categories", title: "All-Star", desc: "Order from every category", icon: Sparkles, color: "text-[#75F663]", bg: "bg-[#75F663]/20" },
  { key: "founding_member", title: "Founding Member", desc: "Joined during launch", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  { key: "customizer_4", title: "Meal Prep Master", desc: "Customize meals 4 weeks straight", icon: Utensils, color: "text-emerald-400", bg: "bg-emerald-500/20" },
];

const LEVELS = [
  { name: "Seedling", minOrders: 0, perks: ["Access to dashboard", "Basic rewards earning"], emoji: "🌱" },
  { name: "Sprout", minOrders: 5, perks: ["2x points on Wednesdays", "Early menu access"], emoji: "🌿" },
  { name: "Harvest", minOrders: 20, perks: ["Free delivery always", "Birthday meal", "Priority support"], emoji: "🌾" },
  { name: "Legend", minOrders: 50, perks: ["VIP menu items", "Tasting event invites", "Merch drops"], emoji: "👑" },
];

export default async function RewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/rewards");

  const [pointsRes, pointsBalanceRes, profileRes, referralsRes, achievementsRes, levelRes] = await Promise.all([
    supabase
      .from("reward_points")
      .select("id, points, source, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    // Separate unlimited query for accurate balance calculation
    supabase
      .from("reward_points")
      .select("points")
      .eq("user_id", user.id),
    supabase
      .from("user_profiles")
      .select("referral_code, food_personality_type")
      .eq("id", user.id)
      .single(),
    supabase
      .from("referrals")
      .select("id, referred_id, status, referrer_reward_value, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("customer_achievements")
      .select("achievement_key, unlocked_at")
      .eq("user_id", user.id),
    supabase
      .from("customer_levels")
      .select("level, lifetime_orders, lifetime_spend, lifetime_referrals")
      .eq("user_id", user.id)
      .single(),
  ]);

  const pointsHistory = pointsRes.data || [];
  // Use the unlimited query for accurate balance (not truncated by limit)
  const allPoints = pointsBalanceRes.data || [];
  const totalPoints = allPoints.reduce((sum: number, p: { points: number }) => sum + p.points, 0);
  const totalEarned = allPoints.filter((p: { points: number }) => p.points > 0).reduce((sum: number, p: { points: number }) => sum + p.points, 0);
  const totalRedeemed = Math.abs(allPoints.filter((p: { points: number }) => p.points < 0).reduce((sum: number, p: { points: number }) => sum + p.points, 0));
  const referralCode = profileRes.data?.referral_code || "MADFRESH";
  const referrals = referralsRes.data || [];
  const completedReferrals = referrals.filter((r: { status: string }) => r.status === "completed").length;

  // Achievements
  const unlockedMap = new Map<string, string>();
  (achievementsRes.data || []).forEach((a: { achievement_key: string; unlocked_at: string }) => {
    unlockedMap.set(a.achievement_key, a.unlocked_at);
  });
  const unlockedCount = unlockedMap.size;

  // Levels
  const levelData = levelRes.data;
  const lifetimeOrders = levelData?.lifetime_orders || 0;
  let currentLevelIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (lifetimeOrders >= LEVELS[i].minOrders) { currentLevelIdx = i; break; }
  }
  const currentLevel = LEVELS[currentLevelIdx];
  const nextLevel = currentLevelIdx < LEVELS.length - 1 ? LEVELS[currentLevelIdx + 1] : null;
  const levelProgress = nextLevel
    ? ((lifetimeOrders - currentLevel.minOrders) / (nextLevel.minOrders - currentLevel.minOrders)) * 100
    : 100;

  const nextReward = REDEEM_TABLE.find(r => r.points > totalPoints);
  const pointsToNext = nextReward ? nextReward.points - totalPoints : 0;

  // Find next badges the user is closest to earning
  const lockedBadges = ALL_ACHIEVEMENTS.filter(b => !unlockedMap.has(b.key));

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d18]">Rewards</h1>
        <p className="text-[#7a7060] text-sm mt-1">Earn points, unlock badges, grow your impact</p>
      </div>

      {/* ─── Points Balance Hero ─── */}
      <div className="bg-white border border-[#3d6b2a]/15 rounded-2xl p-5 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#e9f0e4] rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-sm text-[#3d6b2a] font-semibold mb-1">Your Points Balance</p>
          <p className="text-4xl sm:text-5xl font-black text-[#1e2d18] mb-2">{totalPoints.toLocaleString()}</p>
          <div className="flex items-center gap-3 text-xs text-[#9a9080]">
            <span className="flex items-center gap-1"><TrendingUp size={12} className="text-green-400" /> {totalEarned.toLocaleString()} earned</span>
            <span className="flex items-center gap-1"><TrendingDown size={12} className="text-orange-400" /> {totalRedeemed.toLocaleString()} redeemed</span>
          </div>
          {nextReward && (
            <div className="mt-4 bg-[#f2efe8] rounded-xl p-3">
              <p className="text-xs text-[#7a7060]">
                <span className="text-[#3d6b2a] font-bold">{pointsToNext.toLocaleString()}</span> pts to <span className="text-[#1e2d18] font-semibold">{nextReward.reward}</span>
              </p>
              <div className="w-full max-w-[200px] h-1.5 bg-[#f2efe8] rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#3d6b2a] rounded-full" style={{ width: `${Math.min((totalPoints / nextReward.points) * 100, 100)}%` }} />
              </div>
            </div>
          )}

          {/* Level badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-lg">{currentLevel.emoji}</span>
            <span className="text-sm font-bold text-[#1e2d18]">{currentLevel.name}</span>
            {nextLevel && (
              <span className="text-xs text-[#9a9080]">
                {lifetimeOrders}/{nextLevel.minOrders} orders to {nextLevel.name} {nextLevel.emoji}
              </span>
            )}
          </div>
          {nextLevel && (
            <div className="w-full max-w-[200px] h-1 bg-[#f2efe8] rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-gradient-to-r from-[#3d6b2a] to-[#75F663] rounded-full" style={{ width: `${Math.min(levelProgress, 100)}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* ─── Redeem Section ─── */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-4 sm:p-6">
        <h2 className="text-[#1e2d18] font-bold mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[#3d6b2a]" /> Redeem Points
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {REDEEM_TABLE.map((item) => {
            const canRedeem = totalPoints >= item.points;
            return (
              <div key={item.tier} className={`rounded-xl p-3 sm:p-4 border text-center ${canRedeem ? "border-[#3d6b2a]/15 bg-[#e9f0e4]" : "border-[#ede9e2] bg-white"}`}>
                <p className="text-lg sm:text-xl font-black text-[#1e2d18]">{item.points.toLocaleString()}</p>
                <p className="text-[11px] sm:text-xs text-[#7a7060] mt-1 leading-tight">{item.reward}</p>
                <RedeemButton tier={item.tier} points={item.points} reward={item.reward} canRedeem={canRedeem} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── How to Earn ─── */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-4 sm:p-6">
        <h2 className="text-[#1e2d18] font-bold mb-3">How to Earn Points</h2>
        <div className="space-y-0">
          {EARN_TABLE.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#ede9e2] last:border-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#f2efe8] flex items-center justify-center flex-shrink-0">
                  <item.icon size={13} className="text-[#3d6b2a]" />
                </div>
                <span className="text-sm text-[#4a5e3a] truncate">{item.action}</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#3d6b2a] whitespace-nowrap flex-shrink-0">{item.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Referral Section ─── */}
      <div className="bg-white border border-[#3d6b2a]/15 rounded-2xl p-4 sm:p-6">
        <h2 className="text-[#1e2d18] font-bold mb-4 flex items-center gap-2">
          <Gift size={18} className="text-[#3d6b2a]" /> Refer &amp; Earn
        </h2>
        <p className="text-xs text-[#7a7060] mb-3">
          Share your link. When a friend orders, you both earn 500 pts + they get 15% off.
        </p>
        <RewardsClient referralCode={referralCode} />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-[#f2efe8] rounded-xl p-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-[#1e2d18]">{completedReferrals}</p>
            <p className="text-[11px] sm:text-xs text-[#9a9080]">Successful Referrals</p>
          </div>
          <div className="bg-[#f2efe8] rounded-xl p-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-[#3d6b2a]">{(completedReferrals * 500).toLocaleString()}</p>
            <p className="text-[11px] sm:text-xs text-[#9a9080]">Points from Referrals</p>
          </div>
        </div>
      </div>

      {/* ─── Donations ─── */}
      <div className="bg-white border border-pink-200 rounded-2xl p-4 sm:p-6">
        <h2 className="text-[#1e2d18] font-bold mb-2 flex items-center gap-2">
          <Heart size={18} className="text-pink-600" /> Give &amp; Earn
        </h2>
        <p className="text-xs text-[#7a7060] mb-3">
          Earn 1 point for every $1 you donate. Mad Fresh matches your donation dollar-for-dollar.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f2efe8] rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-pink-600">1 pt / $1</p>
            <p className="text-[10px] text-[#9a9080] mt-0.5">You earn</p>
          </div>
          <div className="bg-[#f2efe8] rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-pink-600">$1 matched</p>
            <p className="text-[10px] text-[#9a9080] mt-0.5">Mad Fresh donates</p>
          </div>
        </div>
        <a
          href="/my-donations"
          className="mt-3 block text-center text-sm font-semibold text-pink-600 bg-pink-50 border border-pink-200 rounded-xl py-2.5 hover:bg-pink-100 transition"
        >
          View My Donations
        </a>
      </div>

      {/* ─── Achievements / Badges ─── */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-4 sm:p-6">
        <h2 className="text-[#1e2d18] font-bold mb-2 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" /> Achievements
        </h2>
        <p className="text-xs text-[#9a9080] mb-4">{unlockedCount}/{ALL_ACHIEVEMENTS.length} badges unlocked</p>

        {/* Upcoming badges to earn */}
        {lockedBadges.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-widest text-[#9a9080] font-semibold mb-2">Up Next</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {lockedBadges.slice(0, 5).map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.key}
                    className="flex-shrink-0 w-[90px] rounded-xl border border-dashed border-[#ddd8cc] bg-white p-3 text-center"
                  >
                    <div className="w-10 h-10 rounded-xl mx-auto mb-1.5 flex items-center justify-center bg-[#f2efe8]">
                      <Icon size={18} className="text-[#9a9080]" />
                    </div>
                    <p className="text-[10px] font-semibold text-[#9a9080] leading-tight">{badge.title}</p>
                    <p className="text-[9px] text-[#9a9080] mt-0.5 leading-tight">{badge.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All badges grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {ALL_ACHIEVEMENTS.map((badge) => {
            const unlocked = unlockedMap.has(badge.key);
            const unlockedAt = unlocked ? unlockedMap.get(badge.key) : null;
            const Icon = badge.icon;
            return (
              <div
                key={badge.key}
                className={`rounded-xl p-3 border text-center transition ${
                  unlocked
                    ? "border-[#ddd8cc] bg-white"
                    : "border-[#ede9e2] bg-[#faf8f3] opacity-50"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${unlocked ? badge.bg : "bg-[#f2efe8]"}`}>
                  <Icon size={20} className={unlocked ? badge.color : "text-[#9a9080]"} />
                </div>
                <p className={`font-bold text-[11px] leading-tight ${unlocked ? "text-[#1e2d18]" : "text-[#9a9080]"}`}>{badge.title}</p>
                <p className="text-[9px] text-[#9a9080] mt-0.5 leading-tight">{badge.desc}</p>
                {unlockedAt && (
                  <p className="text-[9px] text-[#3d6b2a] mt-1">
                    {new Date(unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-[#1e2d18]">{lifetimeOrders}</p>
          <p className="text-[10px] text-[#9a9080]">Orders</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-[#1e2d18]">${Number(levelData?.lifetime_spend || 0).toFixed(0)}</p>
          <p className="text-[10px] text-[#9a9080]">Spent</p>
        </div>
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-3 text-center">
          <p className="text-lg font-black text-[#1e2d18]">{levelData?.lifetime_referrals || 0}</p>
          <p className="text-[10px] text-[#9a9080]">Referrals</p>
        </div>
      </div>

      {/* ─── Points History (Collapsible) ─── */}
      <CollapsibleSection title="Points History">
        {pointsHistory.length > 0 ? (
          <div className="divide-y divide-[#ede9e2]">
            {pointsHistory.map((entry: { id: string; points: number; source: string; description: string | null; created_at: string }) => (
              <div key={entry.id} className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#1e2d18] truncate">{entry.description || entry.source.replace(/_/g, " ")}</p>
                  <p className="text-xs text-[#9a9080]">{new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${entry.points > 0 ? "text-[#3d6b2a]" : "text-orange-400"}`}>
                  {entry.points > 0 ? "+" : ""}{entry.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-6 pb-6 text-center py-8">
            <Star size={32} className="text-[#9a9080] mx-auto mb-3" />
            <p className="text-[#7a7060] text-sm">No points earned yet</p>
            <p className="text-[#9a9080] text-xs mt-1">Place your first order to start earning!</p>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
