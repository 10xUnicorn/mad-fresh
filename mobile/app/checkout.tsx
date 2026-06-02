import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { createCheckout, getAccessToken } from '@/lib/api';
import { Button } from '@/components/Button';

export default function CheckoutScreen() {
  const { items, getSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');

  const subtotal = getSubtotal();
  const deliveryFee = fulfillment === 'delivery' && subtotal < 40 ? 5.99 : 0;
  const taxRate = 0.086;
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert('Sign In Required', 'Please sign in to place an order.');
        setLoading(false);
        return;
      }

      const payload = {
        items: items.map((i) => ({
          recipe_id: i.recipe.id,
          quantity: i.quantity,
          fulfillment_type: fulfillment,
        })),
        customerEmail: user?.email || '',
        customerName: user?.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
          : user?.email || '',
        fulfillmentType: fulfillment,
      };

      const result = await createCheckout(payload as any, token);

      // For now, we'll treat a successful checkout call as order placed
      // Full Stripe payment sheet integration requires a dev build (not Expo Go)
      clearCart();
      router.replace({
        pathname: '/order-confirmation',
        params: {
          orderId: (result as any).orderId || '',
          orderNumber: (result as any).orderNumber || '',
          total: total.toFixed(2),
        },
      });
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    router.replace('/cart');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fulfillment Type */}
        <Text style={styles.sectionTitle}>Fulfillment</Text>
        <View style={styles.fulfillmentRow}>
          <Pressable
            style={[styles.fulfillmentOption, fulfillment === 'pickup' && styles.fulfillmentActive]}
            onPress={() => setFulfillment('pickup')}
          >
            <Text style={[styles.fulfillmentText, fulfillment === 'pickup' && styles.fulfillmentTextActive]}>
              Pickup
            </Text>
          </Pressable>
          <Pressable
            style={[styles.fulfillmentOption, fulfillment === 'delivery' && styles.fulfillmentActive]}
            onPress={() => setFulfillment('delivery')}
          >
            <Text style={[styles.fulfillmentText, fulfillment === 'delivery' && styles.fulfillmentTextActive]}>
              Delivery
            </Text>
          </Pressable>
        </View>

        {fulfillment === 'pickup' && (
          <View style={styles.pickupInfo}>
            <Text style={styles.pickupTitle}>Pickup Location</Text>
            <Text style={styles.pickupAddress}>455 S 48th St, Tempe, AZ 85281</Text>
          </View>
        )}

        {/* Order Summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((item) => (
          <View key={item.recipe.id} style={styles.orderItem}>
            <Text style={styles.orderItemQty}>{item.quantity}x</Text>
            <Text style={styles.orderItemName} numberOfLines={1}>{item.recipe.name}</Text>
            <Text style={styles.orderItemPrice}>${(item.recipe.base_price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        {deliveryFee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
        )}
        {fulfillment === 'delivery' && subtotal >= 40 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (8.6%)</Text>
          <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
        <Button title="Place Order" onPress={handleCheckout} loading={loading} />
        <Text style={styles.disclaimer}>
          Payment will be processed via Stripe. Pickup orders are prepared within 30 minutes.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary },
  backText: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.semibold },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  sectionTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  fulfillmentRow: { flexDirection: 'row', gap: spacing.md },
  fulfillmentOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  fulfillmentActive: { borderColor: colors.green, backgroundColor: colors.successBg },
  fulfillmentText: { fontSize: font.size.md, fontWeight: font.weight.medium, color: colors.textMuted },
  fulfillmentTextActive: { color: colors.green, fontWeight: font.weight.semibold },
  pickupInfo: {
    backgroundColor: colors.warm,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  pickupTitle: { fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.textPrimary },
  pickupAddress: { fontSize: font.size.sm, color: colors.textSecondary, marginTop: 4 },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  orderItemQty: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.green, width: 36 },
  orderItemName: { flex: 1, fontSize: font.size.md, color: colors.textPrimary },
  orderItemPrice: { fontSize: font.size.md, color: colors.textPrimary, fontWeight: font.weight.medium },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { fontSize: font.size.md, color: colors.textMuted },
  summaryValue: { fontSize: font.size.md, color: colors.textPrimary },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalRow: {
    marginBottom: spacing.lg,
  },
  totalLabel: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  totalValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.green },
  disclaimer: {
    fontSize: font.size.xs,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
});
