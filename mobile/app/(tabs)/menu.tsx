import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { fetchMenu } from '@/lib/api';
import { useCart } from '@/lib/cart';
import type { Recipe } from '@shared/types';

function MenuCard({ item }: { item: Recipe }) {
  const { addItem } = useCart();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id, data: JSON.stringify(item) } })}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.placeholderEmoji}>🍽</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          {item.is_featured && <Text style={styles.featuredBadge}>Featured</Text>}
        </View>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>${item.base_price.toFixed(2)}</Text>
          {item.is_sold_out ? (
            <Text style={styles.soldOut}>Sold Out</Text>
          ) : (
            <Pressable
              style={styles.addBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                addItem(item);
              }}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </Pressable>
          )}
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tags}>
            {item.tags.slice(0, 3).map((tag) => (
              <Text key={tag} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function MenuScreen() {
  const [menu, setMenu] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const cartCount = useCart((s) => s.getItemCount());

  const loadMenu = useCallback(async () => {
    try {
      setError('');
      const data = await fetchMenu();
      setMenu((data as any).menu || (data as any) || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load menu');
    }
  }, []);

  useEffect(() => {
    loadMenu().finally(() => setLoading(false));
  }, [loadMenu]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  }, [loadMenu]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={loadMenu}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        {cartCount > 0 && (
          <Pressable style={styles.cartBadge} onPress={() => router.push('/cart')}>
            <Text style={styles.cartBadgeText}>Cart ({cartCount})</Text>
          </Pressable>
        )}
      </View>
      <FlashList
        data={menu}
        renderItem={({ item }) => <MenuCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  title: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary },
  cartBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  cartBadgeText: { color: colors.textWhite, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: {
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: { fontSize: 40 },
  cardBody: { padding: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  featuredBadge: {
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    color: colors.green,
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  cardDesc: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cardPrice: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.green,
  },
  soldOut: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color: colors.error,
  },
  addBtn: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: colors.textWhite,
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  errorText: { color: colors.error, fontSize: font.size.md, marginBottom: spacing.lg },
  retryBtn: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryText: { color: colors.textWhite, fontWeight: font.weight.semibold },
});
