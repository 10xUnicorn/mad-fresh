import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, RefreshCw, ChevronRight, Package, Clock,
  Star, Flame, Trophy, Gift, Heart, ArrowRight, UtensilsCrossed,
  MapPin, Zap
} from "lucide-react";
import DashboardOrderSection from "@/components/customer/DashboardOrderSection";
import QuickReorder from "@/components/customer/QuickReorder";

export const metadata = { title: "My Dashboard | Mad Fresh Kitchen" };

const LEVEL_THRESHOLDS = [
  { name: "Seedling", minOrders: 0, color: "text-green-400", bg: "bg-[#e9f0e4]", emoji: "🌱" },
  { name: "Sprout", minOrders: 5, color: "text-emerald-400", bg: "bg-[#e9f0e4]", emoji: "🌿" },
  { name: "Harvest", minOrders: 20, color: "text-[#3d6b2a]", bg: "bg-[#e9f0e4]", emoji: "🌾" },
  { name: "Legend", minOrders: 50, color: "text-yellow-400", bg: "bg-amber-50", emoji: "👑" },
];

function getLevel(orders: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (orders >= LEVEL_THRESHOLDS[i].minOrders) return LEVEL_THRESHOLDS[i];
  }
  return LEVEL_THRESHOLDS[0];
}

function getNextLevel(orders: number) {
  for (const t of LEVEL_THRESHOLDS) {
    if (orders < t.minOrders) return t;
  }
  return null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  // Phase 1: All independent queries run in parallel (no nested awaits)
  const [
    ordersRes, recentOrderIdsRes, subsRes, profileRes, streakRes,
    pointsRes, levelRes, achievementsRes, recipesRes, reorderOrdersRes
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total_amount, payment_status, created_at, fulfillment_type")
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    // Separate query for order IDs (was previously nested inside Promise.all — caused waterfall)
    supabase
      .from("orders")
      .select("id")
      .eq("customer_id", user.id)
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("subscriptions")
      .select("id, status, billing_interval, current_price, next_delivery_date, delivery_day, plan_id, is_founding_member")
      .eq("customer_id", user.id)
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .in("status", ["active", "paused"])
      .limit(1),
    supabase
      .from("user_profiles")
      .select("first_name, referral_code, total_meals_donated, food_personality_type")
      .eq("id", user.id)
      .single(),
    supabase
      .from("customer_streaks")
      .select("current_streak, longest_streak, streak_frozen")
      .eq("user_id", user.id)
      .eq("streak_type", "weekly_order")
      .single(),
    supabase
      .from("reward_points")
      .select("points")
      .eq("user_id", user.id),
    supabase
      .from("customer_levels")
      .select("level, lifetime_orders, lifetime_spend, lifetime_referrals")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("customer_achievements")
      .select("achievement_key")
      .eq("user_id", user.id),
    supabase
      .from("recipes")
      .select("*")
      .eq("is_available", true)
      .eq("is_visible", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true }),
    supabase
      .from("orders")
      .select("id, order_number, total_amount, created_at")
      .eq("store_id", "b0000000-0000-0000-0000-000000000001")
      .eq("customer_id", user.id)
      .in("status", ["completed", "delivered", "confirmed", "ready", "pending"])
      .order("created_at", { ascending: false })
      .limit(2),
  ]);

  // Phase 2: Fetch order_items using the IDs from phase 1
  const recentOrderIds = recentOrderIdsRes.data?.map((o: { id: string }) => o.id) || [];
  const orderItemsRes = recentOrderIds.length > 0
    ? await supabase
        .from("order_items")
        .select("recipe_id, quantity")
        .in("order_id", recentOrderIds)
    : { data: [] };

  const orders = ordersRes.data || [];
  const activeSub = subsRes.data?.[0] || null;
  const profile = profileRes.data;
  const streak = streakRes.data;
  const pointsData = pointsRes.data || [];
  const levelData = levelRes.data;
  const achievements = achievementsRes.data || [];
  const recipes = recipesRes.data || [];
  const orderItems = orderItemsRes.data || [];
  const reorderOrders = reorderOrdersRes.data || [];

  const firstName = profile?.first_name || "Friend";
  const totalPoints = pointsData.reduce((sum: number, p: { points: number }) => sum + p.points, 0);
  const currentStreak = streak?.current_streak || 0;
  const lifetimeOrders = levelData?.lifetime_orders || orders.length;

  const level = getLevel(lifetimeOrders);
  const nextLevel = getNextLevel(lifetimeOrders);
  const progressToNext = nextLevel
    ? ((lifetimeOrders - level.minOrders) / (nextLevel.minOrders - level.minOrders)) * 100
    : 100;

  /* ── Build Recommendations ── */
  const recommendations: Array<{
    recipe: typeof recipes[0];
    reason: string;
    badge?: string;
    bonus_points?: number;
  }> = [];

  const frequencyMap = new Map<string, number>();
  orderItems.forEach((oi: { recipe_id: string; quantity: number }) => {
    frequencyMap.set(oi.recipe_id, (frequencyMap.get(oi.recipe_id) || 0) + (oi.quantity || 1));
  });
  const sortedByFreq = [...frequencyMap.entries()].sort((a, b) => b[1] - a[1]);
  const favoriteIds = sortedByFreq.slice(0, 2).map(([id]) => id);

  favoriteIds.forEach(id => {
    const recipe = recipes.find(r => r.id === id);
    if (recipe && !recipe.is_sold_out) {
      recommendations.push({
        recipe,
        reason: `You've ordered this ${frequencyMap.get(id)} times`,
        badge: "favorite",
      });
    }
  });

  const orderedCategories = new Set(
    orderItems
      .map((oi: { recipe_id: string }) => recipes.find(r => r.id === oi.recipe_id)?.category)
      .filter(Boolean)
  );
  const newCategoryRecipe = recipes.find(
    r => !orderedCategories.has(r.category) && !r.is_sold_out && r.base_price > 0
  );
  if (newCategoryRecipe) {
    recommendations.push({
      recipe: newCategoryRecipe,
      reason: `Try a ${newCategoryRecipe.category} for the first time!`,
      badge: "new",
      bonus_points: 50,
    });
  }

  const featuredNew = recipes.find(
    r => r.is_featured && !frequencyMap.has(r.id) && !r.is_sold_out
  );
  if (featuredNew && !recommendations.some(r => r.recipe.id === featuredNew.id)) {
    recommendations.push({
      recipe: featuredNew,
      reason: "Chef's pick — earn bonus points!",
      badge: "points",
      bonus_points: 75,
    });
  }

  /* ── Build Quick Reorder Data ── */
  // Fetch items for the last 2 orders
  const reorderOrderIds = reorderOrders.map((o: { id: string }) => o.id);
  const reorderItemsRes = reorderOrderIds.length > 0
    ? await supabase
        .from("order_items")
        .select("order_id, recipe_id, quantity, unit_price")
        .in("order_id", reorderOrderIds)
    : { data: [] };
  const reorderItems = reorderItemsRes.data || [];

  // Build PastOrder objects with full item details
  const buildPastOrder = (order: typeof reorderOrders[0]) => {
    const items = reorderItems
      .filter((oi: { order_id: string }) => oi.order_id === order.id)
      .map((oi: { recipe_id: string; quantity: number; unit_price: number }) => {
        const recipe = recipes.find((r: { id: string }) => r.id === oi.recipe_id);
        return {
          recipe_id: oi.recipe_id,
          name: recipe?.name || "Unknown Item",
          price: oi.unit_price || recipe?.base_price || 0,
          quantity: oi.quantity || 1,
          image_url: recipe?.image_url || null,
          category: recipe?.category || "bowl",
        };
      })
      .filter((i: { name: string }) => i.name !== "Unknown Item");
    return {
      id: order.id,
      order_number: order.order_number,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items,
    };
  };

  const lastOrder = reorderOrders[0] ? buildPastOrder(reorderOrders[0]) : null;
  const secondLastOrder = reorderOrders[1] ? buildPastOrder(reorderOrders[1]) : null;

  // Top favorite item from frequency map
  const topFavId = sortedByFreq[0]?.[0];
  const topFavRecipe = topFavId ? recipes.find((r: { id: string }) => r.id === topFavId) : null;
  const topFavorite = topFavRecipe ? {
    id: topFavRecipe.id,
    name: topFavRecipe.name,
    base_price: topFavRecipe.base_price,
    image_url: topFavRecipe.image_url,
    category: topFavRecipe.category,
    is_featured: topFavRecipe.is_featured,
  } : null;

  // Bonus point items = featured items the user hasn't ordered
  const bonusPointItemsList = recipes
    .filter((r: { is_featured: boolean; id: string; is_sold_out?: boolean }) =>
      r.is_featured && !frequencyMap.has(r.id) && !r.is_sold_out
    )
    .slice(0, 3)
    .map((r: { id: string; name: string; base_price: number; image_url: string | null; category: string; is_featured: boolean }) => ({
      id: r.id,
      name: r.name,
      base_price: r.base_price,
      image_url: r.image_url,
      category: r.category,
      is_featured: r.is_featured,
      bonus_points: 75,
    }));

  // Featured items the user hasn't tried
  const featuredItemsList = recipes
    .filter((r: { is_featured: boolean; id: string; is_sold_out?: boolean }) =>
      r.is_featured && !r.is_sold_out
    )
    .slice(0, 4)
    .map((r: { id: string; name: string; base_price: number; image_url: string | null; category: string; is_featured: boolean }) => ({
      id: r.id,
      name: r.name,
      base_price: r.base_price,
      image_url: r.image_url,
      category: r.category,
      is_featured: r.is_featured,
    }));

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    preparing: "bg-amber-50 text-amber-700",
    ready: "bg-[#e9f0e4] text-[#3d6b2a]",
    out_for_delivery: "bg-purple-50 text-purple-700",
    delivered: "bg-[#e9f0e4] text-[#3d6b2a]",
    completed: "bg-[#e9f0e4] text-[#3d6b2a]",
    cancelled: "bg-red-50 text-red-700",
    refunded: "bg-[#f2efe8] text-[#7a7060]",
  };

  return (
    <div className="space-y-5">
      {/* ═══ GREETING + LEVEL — single compact row ═══ */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-[#1e2d18] leading-tight truncate">
            Hey, <span className="text-[#3d6b2a]">{firstName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${level.bg} ${level.color} flex items-center gap-1`}>
            {level.emoji} {level.name}
          </span>
          {activeSub?.is_founding_member && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              Founder
            </span>
          )}
        </div>
      </div>

      {/* ═══ COMPACT 3-STAT ROW ═══ */}
      <div className="flex items-stretch gap-2">
        <Link href="/rewards" className="flex-1 bg-white border border-[#ddd8cc] rounded-xl px-3 py-3 hover:bg-[#f0ece3] transition text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Star size={14} className="text-[#3d6b2a]" />
            <span className="text-lg font-black text-[#1e2d18] tabular-nums">{totalPoints.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-[#9a9080] font-medium">Points</p>
        </Link>
        <div className="flex-1 bg-white border border-[#ddd8cc] rounded-xl px-3 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame size={14} className="text-orange-400" />
            <span className="text-lg font-black text-[#1e2d18] tabular-nums">{currentStreak}</span>
          </div>
          <p className="text-[10px] text-[#9a9080] font-medium">Week Streak</p>
        </div>
        <Link href="/achievements" className="flex-1 bg-white border border-[#ddd8cc] rounded-xl px-3 py-3 hover:bg-[#f0ece3] transition text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-lg font-black text-[#1e2d18] tabular-nums">{achievements.length}</span>
          </div>
          <p className="text-[10px] text-[#9a9080] font-medium">Badges</p>
        </Link>
      </div>

      {/* Level progress — thin inline bar */}
      {nextLevel && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1">
            <div className="w-full h-1.5 bg-[#f2efe8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3d6b2a] to-[#75F663] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-[#9a9080] flex-shrink-0">
            {lifetimeOrders}/{nextLevel.minOrders} to {nextLevel.emoji} {nextLevel.name}
          </span>
        </div>
      )}

      {/* ═══ HORIZONTAL QUICK ACTIONS ═══ */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <Link href="/order" className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] text-white rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition flex-shrink-0">
          <UtensilsCrossed size={14} /> Order Now
        </Link>
        {activeSub && (
          <Link href="/subscription" className="flex items-center gap-2 px-4 py-2.5 bg-[#f2efe8] border border-[#ddd8cc] text-[#1e2d18] rounded-full text-xs font-medium whitespace-nowrap hover:bg-[#f0ece3] transition flex-shrink-0">
            <RefreshCw size={13} /> Subscription
          </Link>
        )}
        <Link href="/referrals" className="flex items-center gap-2 px-4 py-2.5 bg-[#f2efe8] border border-[#ddd8cc] text-[#1e2d18] rounded-full text-xs font-medium whitespace-nowrap hover:bg-[#f0ece3] transition flex-shrink-0">
          <Gift size={13} /> Refer & Earn
        </Link>
        <Link href="/my-donations" className="flex items-center gap-2 px-4 py-2.5 bg-[#f2efe8] border border-[#ddd8cc] text-[#1e2d18] rounded-full text-xs font-medium whitespace-nowrap hover:bg-[#f0ece3] transition flex-shrink-0">
          <Heart size={13} /> Donate Meals
        </Link>
      </div>

      {/* ═══ QUICK REORDER ═══ */}
      <QuickReorder
        lastOrder={lastOrder}
        secondLastOrder={secondLastOrder}
        topFavorite={topFavorite}
        bonusPointItems={bonusPointItemsList}
        featuredItems={featuredItemsList}
      />

      {/* ═══ ACTIVE SUBSCRIPTION CARD ═══ */}
      {activeSub && (
        <div className="bg-[#e9f0e4]/50 border border-[#3d6b2a]/15 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e9f0e4] flex items-center justify-center">
                <RefreshCw size={18} className="text-[#3d6b2a]" />
              </div>
              <div>
                <p className="text-[#1e2d18] font-bold text-sm">${Number(activeSub.current_price).toFixed(2)}/{activeSub.billing_interval}</p>
                {activeSub.next_delivery_date && (
                  <p className="text-[#9a9080] text-xs mt-0.5">
                    Next: {new Date(activeSub.next_delivery_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
            </div>
            <Link href="/subscription" className="px-4 py-2 bg-[#3d6b2a] text-white font-bold rounded-xl text-xs hover:bg-[#2f5720] transition active:scale-95">
              Manage
            </Link>
          </div>
        </div>
      )}

      {/* ═══ GET BONUS POINTS (Recommendations) ═══ */}
      <DashboardOrderSection
        recipes={recipes}
        recommendations={recommendations}
        userId={user.id}
      />

      {/* ═══ REFERRAL CTA ═══ */}
      {profile?.referral_code && (
        <Link href="/referrals" className="block bg-white border border-[#ddd8cc] rounded-2xl p-4 hover:bg-[#f0ece3] transition active:bg-[#f0ece3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e9f0e4] flex items-center justify-center flex-shrink-0">
              <Gift size={18} className="text-[#3d6b2a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1e2d18] font-semibold text-sm">Invite friends, earn 500 pts each</p>
              <p className="text-[#9a9080] text-xs mt-0.5">
                Code: <span className="text-[#3d6b2a] font-mono font-bold">{profile.referral_code}</span>
              </p>
            </div>
            <ChevronRight size={16} className="text-[#9a9080] flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* ═══ RECENT ORDERS — compact ═══ */}
      {orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-[#1e2d18]">Recent Orders</h2>
            <Link href="/orders" className="text-[11px] text-[#3d6b2a] font-semibold hover:underline flex items-center gap-0.5">
              See All <ChevronRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between bg-white border border-[#ddd8cc] rounded-xl px-3.5 py-3 hover:bg-[#f0ece3] transition gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#f2efe8] flex items-center justify-center flex-shrink-0">
                    {order.fulfillment_type === "delivery" ? <Package size={14} className="text-[#9a9080]" /> : <Clock size={14} className="text-[#9a9080]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#1e2d18] font-semibold text-sm truncate">{order.order_number}</p>
                    <p className="text-[#9a9080] text-[11px]">
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[order.status] || "bg-[#f2efe8] text-[#7a7060]"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <p className="text-[#1e2d18] font-semibold text-xs tabular-nums">${Number(order.total_amount).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {orders.length === 0 && !activeSub && (
        <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#e9f0e4] flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed size={24} className="text-[#3d6b2a]" />
          </div>
          <h3 className="text-[#1e2d18] font-bold text-base mb-1">Welcome to Mad Fresh!</h3>
          <p className="text-[#9a9080] text-sm mb-4">Ready for your first meal? Browse our menu to get started.</p>
          <Link
            href="/order"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3d6b2a] text-white font-bold rounded-xl text-sm hover:bg-[#2f5720] transition active:scale-95"
          >
            <UtensilsCrossed size={16} /> Explore the Menu
          </Link>
        </div>
      )}
    </div>
  );
}
