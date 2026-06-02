import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { colors, font, spacing, radius } from '@/theme';
import { fetchOrderDetail } from '@/lib/queries';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrderDetail(id)
      .then(({ order, items }) => {
        setOrder(order);
        setItems(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Order #{order.order_number}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{order.status}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{order.fulfillment_type}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Payment</Text>
            <Text style={styles.infoValue}>{order.payment_status}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            {item.recipes?.image_url ? (
              <Image source={{ uri: item.recipes.image_url }} style={styles.itemImage} contentFit="cover" />
            ) : (
              <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                <Text>🍽</Text>
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.recipes?.name || 'Item'}</Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>${(item.unit_price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${order.items_subtotal?.toFixed(2)}</Text>
        </View>
        {order.discount_amount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>-${order.discount_amount?.toFixed(2)}</Text>
          </View>
        )}
        {order.delivery_fee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>${order.delivery_fee?.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${order.tax_amount?.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.total_amount?.toFixed(2)}</Text>
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
  title: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  backText: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.semibold },
  backLink: { color: colors.green, fontSize: font.size.md, marginTop: spacing.md },
  errorText: { color: colors.error, fontSize: font.size.md },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  statusCard: {
    backgroundColor: colors.successBg, borderRadius: radius.md, padding: spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl,
  },
  statusLabel: { fontSize: font.size.md, color: colors.textSecondary },
  statusValue: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.green, textTransform: 'capitalize' },
  infoGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  infoItem: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  infoLabel: { fontSize: font.size.xs, color: colors.textMuted },
  infoValue: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textPrimary, marginTop: 4, textTransform: 'capitalize' },
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  itemImage: { width: 50, height: 50, borderRadius: radius.sm },
  itemImagePlaceholder: { backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemName: { fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.textPrimary },
  itemQty: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { fontSize: font.size.md, color: colors.textMuted },
  summaryValue: { fontSize: font.size.md, color: colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.sm },
  totalLabel: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  totalValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.green },
});
