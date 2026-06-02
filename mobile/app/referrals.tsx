import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { fetchReferralCode, getAccessToken } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function ReferralsScreen() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getAccessToken();
      if (token) {
        const data = await fetchReferralCode(token);
        setCode(data.code || '');
      }
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .eq('status', 'completed');
      setReferralCount(count ?? 0);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Use my referral code ${code} to get 50% off your first Mad Fresh order! Download the app: https://madfresh.app`,
      });
    } catch {}
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Referrals</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Share the Love</Text>
          <Text style={styles.heroSubtitle}>
            Give friends 50% off their first order.{'\n'}You get a half-off meal too!
          </Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.codeValue}>{code || '...'}</Text>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share Code</Text>
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{referralCount}</Text>
            <Text style={styles.statLabel}>Successful Referrals</Text>
          </View>
        </View>

        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          {[
            { step: '1', text: 'Share your unique code with friends' },
            { step: '2', text: 'They get 50% off their first order' },
            { step: '3', text: 'You get a half-off meal when they order' },
          ].map((item) => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
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
    backgroundColor: colors.green, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl,
  },
  heroEmoji: { fontSize: 48, marginBottom: spacing.md },
  heroTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textWhite },
  heroSubtitle: { fontSize: font.size.md, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  codeCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  codeLabel: { fontSize: font.size.sm, color: colors.textMuted },
  codeValue: {
    fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.green,
    letterSpacing: 2, marginVertical: spacing.md,
  },
  shareBtn: {
    backgroundColor: colors.green, paddingHorizontal: spacing['2xl'], paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  shareBtnText: { color: colors.textWhite, fontSize: font.size.md, fontWeight: font.weight.semibold },
  statsCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.green },
  statLabel: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 4 },
  howItWorks: {},
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary, marginBottom: spacing.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  stepCircle: {
    width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.successBg,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  stepNum: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.green },
  stepText: { fontSize: font.size.md, color: colors.textPrimary, flex: 1 },
});
