import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { redeemReward, getAccessToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  is_available: boolean;
}

export default function RewardsScreen() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [pointsRes, rewardsRes, achievementsRes] = await Promise.all([
        supabase.from('reward_points').select('points').eq('user_id', user.id).single(),
        supabase.from('rewards_catalog').select('*').eq('is_available', true).order('points_cost'),
        supabase.from('customer_achievements').select('achievement_key, earned_at').eq('user_id', user.id),
      ]);
      setPoints(pointsRes.data?.points ?? 0);
      setRewards(rewardsRes.data ?? []);
      setAchievements(achievementsRes.data ?? []);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleRedeem = async (reward: RewardItem) => {
    if (points < reward.points_cost) {
      Alert.alert('Not Enough Points', `You need ${reward.points_cost - points} more points.`);
      return;
    }
    Alert.alert('Redeem Reward', `Spend ${reward.points_cost} points on "${reward.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Redeem',
        onPress: async () => {
          try {
            const token = await getAccessToken();
            if (!token) return;
            await redeemReward({ reward_id: reward.id }, token);
            Alert.alert('Redeemed!', `You redeemed "${reward.name}".`);
            load();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to redeem reward');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  const ACHIEVEMENT_LABELS: Record<string, { emoji: string; label: string }> = {
    first_order: { emoji: '🎉', label: 'First Order' },
    five_orders: { emoji: '🌟', label: '5 Orders' },
    ten_orders: { emoji: '💪', label: '10 Orders' },
    twenty_orders: { emoji: '🏆', label: '20 Orders' },
    fifty_orders: { emoji: '👑', label: '50 Orders' },
    first_referral: { emoji: '🤝', label: 'First Referral' },
    streak_4: { emoji: '🔥', label: '4-Week Streak' },
    streak_12: { emoji: '⚡', label: '12-Week Streak' },
    first_donation: { emoji: '❤️', label: 'First Donation' },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
    >
      <Text style={styles.title}>Rewards</Text>

      {/* Points Balance */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Your Points</Text>
        <Text style={styles.pointsValue}>{points}</Text>
        <Text style={styles.pointsHint}>Earn points with every order</Text>
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      {achievements.length > 0 ? (
        <View style={styles.achievementsGrid}>
          {achievements.map((a) => {
            const info = ACHIEVEMENT_LABELS[a.achievement_key] || { emoji: '🏅', label: a.achievement_key };
            return (
              <View key={a.achievement_key} style={styles.achievementChip}>
                <Text style={styles.achievementEmoji}>{info.emoji}</Text>
                <Text style={styles.achievementLabel}>{info.label}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>Place orders to earn achievements!</Text>
      )}

      {/* Rewards Catalog */}
      <Text style={styles.sectionTitle}>Redeem Rewards</Text>
      {rewards.length > 0 ? (
        rewards.map((reward) => (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              {reward.description && <Text style={styles.rewardDesc}>{reward.description}</Text>}
            </View>
            <Pressable
              style={[styles.redeemBtn, points < reward.points_cost && styles.redeemBtnDisabled]}
              onPress={() => handleRedeem(reward)}
              disabled={points < reward.points_cost}
            >
              <Text style={[styles.redeemBtnText, points < reward.points_cost && styles.redeemBtnTextDisabled]}>
                {reward.points_cost} pts
              </Text>
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No rewards available right now. Check back soon!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing.xl },
  pointsCard: {
    backgroundColor: colors.green, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl,
  },
  pointsLabel: { fontSize: font.size.sm, color: 'rgba(255,255,255,0.8)' },
  pointsValue: { fontSize: font.size['4xl'], fontWeight: font.weight.bold, color: colors.textWhite, marginTop: spacing.xs },
  pointsHint: { fontSize: font.size.xs, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.md },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  achievementChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.warm, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.warmBorder,
  },
  achievementEmoji: { fontSize: 16 },
  achievementLabel: { fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.textPrimary },
  rewardCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  rewardInfo: { flex: 1, marginRight: spacing.md },
  rewardName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  rewardDesc: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 4 },
  redeemBtn: {
    backgroundColor: colors.green, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  redeemBtnDisabled: { backgroundColor: colors.bgAlt },
  redeemBtnText: { color: colors.textWhite, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  redeemBtnTextDisabled: { color: colors.textFaint },
  emptyText: { fontSize: font.size.md, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
});
