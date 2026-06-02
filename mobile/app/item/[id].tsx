import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '@/theme';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/Button';
import type { Recipe } from '@shared/types';

export default function ItemDetailScreen() {
  const { data } = useLocalSearchParams<{ id: string; data: string }>();
  const item: Recipe = JSON.parse(data || '{}');
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem(item);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const nutrition = [
    { label: 'Calories', value: item.calories },
    { label: 'Protein', value: item.protein_grams, unit: 'g' },
    { label: 'Carbs', value: item.carbs_grams, unit: 'g' },
    { label: 'Fat', value: item.fat_grams, unit: 'g' },
    { label: 'Fiber', value: item.fiber_grams, unit: 'g' },
  ].filter((n) => n.value != null);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.hero} contentFit="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={{ fontSize: 60 }}>🍽</Text>
          </View>
        )}

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.base_price?.toFixed(2)}</Text>
          </View>

          {item.category && (
            <Text style={styles.category}>{item.category}</Text>
          )}

          {item.description && (
            <Text style={styles.desc}>{item.description}</Text>
          )}

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tags}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {nutrition.length > 0 && (
            <View style={styles.nutritionSection}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <View style={styles.nutritionGrid}>
                {nutrition.map((n) => (
                  <View key={n.label} style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {n.value}{n.unit || ''}
                    </Text>
                    <Text style={styles.nutritionLabel}>{n.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {item.prep_time_minutes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prep Time</Text>
              <Text style={styles.infoValue}>{item.prep_time_minutes} min</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {item.is_sold_out ? (
          <Button title="Sold Out" onPress={() => {}} disabled />
        ) : (
          <Button title={`Add to Cart — $${item.base_price?.toFixed(2)}`} onPress={handleAdd} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { width: '100%', height: 280 },
  heroPlaceholder: { backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  backText: { color: colors.green, fontWeight: font.weight.semibold, fontSize: font.size.md },
  body: { padding: spacing.xl },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: font.size['2xl'],
    fontWeight: font.weight.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  price: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.green,
  },
  category: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textTransform: 'capitalize',
    marginTop: spacing.xs,
  },
  desc: {
    fontSize: font.size.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginTop: spacing.lg,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tagChip: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  tagText: { fontSize: font.size.xs, color: colors.green, fontWeight: font.weight.medium },
  nutritionSection: { marginTop: spacing['2xl'] },
  sectionTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 80,
  },
  nutritionValue: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.textPrimary,
  },
  nutritionLabel: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: { fontSize: font.size.md, color: colors.textMuted },
  infoValue: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
