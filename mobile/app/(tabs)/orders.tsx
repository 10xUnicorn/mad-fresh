import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { fetchOrdersList } from '@/lib/queries';

const STATUS_COLORS: Record<string, string> = {
  completed: colors.success,
  confirmed: colors.info,
  preparing: colors.warning,
  pending: colors.textMuted,
  cancelled: colors.error,
  refunded: colors.error,
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchOrdersList(user.id);
      setOrders(data);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>
      {orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Pressable onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.browseLink}>Browse the Menu</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={orders}
          renderItem={({ item }) => (
            <Pressable
              style={styles.orderCard}
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
            >
              <View style={styles.orderTop}>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
                <Text style={[styles.status, { color: STATUS_COLORS[item.status] || colors.textMuted }]}>
                  {item.status}
                </Text>
              </View>
              <View style={styles.orderBottom}>
                <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.orderType}>{item.fulfillment_type}</Text>
                <Text style={styles.orderAmount}>${item.total_amount?.toFixed(2)}</Text>
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md },
  title: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary, marginTop: spacing.lg },
  browseLink: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.medium, marginTop: spacing.md },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  status: { fontSize: font.size.sm, fontWeight: font.weight.semibold, textTransform: 'capitalize' },
  orderBottom: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  orderDate: { fontSize: font.size.sm, color: colors.textMuted },
  orderType: { fontSize: font.size.sm, color: colors.textMuted, textTransform: 'capitalize' },
  orderAmount: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.green, marginLeft: 'auto' },
});
