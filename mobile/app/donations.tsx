import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { fetchDonations, getAccessToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function DonationsScreen() {
  const { user } = useAuth();
  const [totalDonated, setTotalDonated] = useState(0);
  const [mealsDonated, setMealsDonated] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const profileRes = await supabase
        .from('user_profiles')
        .select('total_meals_donated')
        .eq('id', user.id)
        .single();
      setMealsDonated(profileRes.data?.total_meals_donated ?? 0);

      const donationsRes = await supabase
        .from('donations')
        .select('amount')
        .eq('user_id', user.id);
      const total = (donationsRes.data ?? []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
      setTotalDonated(total);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Donations</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>❤️</Text>
          <Text style={styles.heroTitle}>Feed the Community</Text>
          <Text style={styles.heroSubtitle}>
            Every order can help provide meals to those in need
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{mealsDonated}</Text>
            <Text style={styles.statLabel}>Meals Donated</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${totalDonated.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Given</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Donations Work</Text>
          <Text style={styles.infoText}>
            At checkout, you can add a donation to your order. $5 provides one meal to someone
            in need. You can also set up automatic donations with your subscription.
          </Text>
          <Text style={styles.infoText}>
            Mad Fresh partners with local shelters and food banks to distribute donated meals.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: 60, paddingBottom: spacing.md,
  },
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary },
  backText: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.semibold },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'] },
  heroCard: {
    backgroundColor: colors.error, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl,
  },
  heroEmoji: { fontSize: 48, marginBottom: spacing.md },
  heroTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textWhite },
  heroSubtitle: { fontSize: font.size.md, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.green },
  statLabel: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 4 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  infoText: { fontSize: font.size.md, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.md },
});
