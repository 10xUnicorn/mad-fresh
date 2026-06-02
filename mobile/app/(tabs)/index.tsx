import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { fetchDashboardData } from '@/lib/queries';

const LEVEL_CONFIG: Record<string, { emoji: string; next: string; threshold: number }> = {
  seedling: { emoji: '🌱', next: 'sprout', threshold: 5 },
  sprout: { emoji: '🌿', next: 'harvest', threshold: 20 },
  harvest: { emoji: '🌾', next: 'legend', threshold: 50 },
  legend: { emoji: '👑', next: '', threshold: 999 },
};

interface DashboardData {
  profile: any;
  streak: any;
  points: number;
  level: any;
  achievementCount: number;
  recentOrders: any[];
  subscription: any;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const d = await fetchDashboardData(user.id);
      setData(d);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  const firstName = data?.profile?.first_name || user?.email?.split('@')[0] || 'there';
  const levelKey = data?.level?.level || 'seedling';
  const levelInfo = LEVEL_CONFIG[levelKey] || LEVEL_CONFIG.seedling;
  const lifetimeOrders = data?.level?.lifetime_orders || 0;
  const progress = Math.min(lifetimeOrders / levelInfo.threshold, 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {firstName}!</Text>
          <Text style={styles.levelBadge}>{levelInfo.emoji} {levelKey.charAt(0).toUpperCase() + levelKey.slice(1)}</Text>
        </View>
        <Image source={require('../../assets/mad-fresh-logo.png')} style={styles.logo} contentFit="contain" />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.points ?? 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.streak?.current_streak ?? 0}</Text>
          <Text style={styles.statLabel}>Week Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.achievementCount ?? 0}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {/* Level Progress */}
      {levelInfo.next && (
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.sectionTitle}>Level Progress</Text>
            <Text style={styles.levelProgress}>{lifetimeOrders}/{levelInfo.threshold} orders</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.levelHint}>
            {levelInfo.threshold - lifetimeOrders} more orders to reach {levelInfo.next}
          </Text>
        </View>
      )}

      {/* Active Subscription */}
      {data?.subscription && (
        <Pressable style={styles.subCard} onPress={() => router.push('/(tabs)/orders')}>
          <View style={styles.subHeader}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <Text style={[styles.subStatus, data.subscription.status === 'active' ? styles.statusActive : styles.statusPaused]}>
              {data.subscription.status}
            </Text>
          </View>
          <Text style={styles.subPrice}>
            ${data.subscription.current_price}/{data.subscription.billing_interval}
          </Text>
          {data.subscription.next_delivery_date && (
            <Text style={styles.subDelivery}>Next delivery: {data.subscription.next_delivery_date}</Text>
          )}
        </Pressable>
      )}

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <Pressable onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        {data?.recentOrders && data.recentOrders.length > 0 ? (
          data.recentOrders.slice(0, 3).map((order: any) => (
            <Pressable
              key={order.id}
              style={styles.orderRow}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
            >
              <View>
                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>${order.total_amount?.toFixed(2)}</Text>
                <Text style={[styles.orderStatus, order.status === 'completed' ? styles.statusActive : {}]}>
                  {order.status}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No orders yet. Browse the menu!</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/menu')}>
          <Text style={styles.quickEmoji}>🍽</Text>
          <Text style={styles.quickLabel}>Order Now</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.quickEmoji}>⭐</Text>
          <Text style={styles.quickLabel}>Rewards</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => router.push('/referrals')}>
          <Text style={styles.quickEmoji}>🎁</Text>
          <Text style={styles.quickLabel}>Refer</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  greeting: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary },
  levelBadge: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: 4 },
  logo: { width: 44, height: 44 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.green },
  statLabel: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  levelSection: { marginBottom: spacing.xl },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  levelProgress: { fontSize: font.size.sm, color: colors.textMuted },
  progressBg: { height: 8, backgroundColor: colors.bgAlt, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: radius.full },
  levelHint: { fontSize: font.size.xs, color: colors.textFaint, marginTop: spacing.xs },
  subCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subStatus: { fontSize: font.size.xs, fontWeight: font.weight.semibold, textTransform: 'capitalize' },
  statusActive: { color: colors.success },
  statusPaused: { color: colors.warning },
  subPrice: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary, marginTop: spacing.sm },
  subDelivery: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 4 },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary },
  seeAll: { color: colors.green, fontSize: font.size.sm, fontWeight: font.weight.medium },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderNumber: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  orderDate: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderAmount: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  orderStatus: { fontSize: font.size.xs, color: colors.textMuted, textTransform: 'capitalize', marginTop: 2 },
  emptyText: { fontSize: font.size.md, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  quickActions: { flexDirection: 'row', gap: spacing.md },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickEmoji: { fontSize: 28 },
  quickLabel: { fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.textPrimary, marginTop: spacing.xs },
});
