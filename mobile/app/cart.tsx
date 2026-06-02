import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '@/theme';
import { useCart, type CartItem } from '@/lib/cart';
import { Button } from '@/components/Button';

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <View style={styles.itemRow}>
      {item.recipe.image_url ? (
        <Image source={{ uri: item.recipe.image_url }} style={styles.itemImage} contentFit="cover" />
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
          <Text>🍽</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.recipe.name}</Text>
        <Text style={styles.itemPrice}>${(item.recipe.base_price * item.quantity).toFixed(2)}</Text>
      </View>
      <View style={styles.qtyControls}>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateQuantity(item.recipe.id, item.quantity - 1);
          }}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            updateQuantity(item.recipe.id, item.quantity + 1);
          }}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { items, getSubtotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items from the menu to get started</Text>
        <Button title="Browse Menu" onPress={() => router.replace('/(tabs)/menu')} variant="outline" style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  const subtotal = getSubtotal();
  const taxRate = 0.086;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Your Cart</Text>
        <Pressable onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <CartItemRow key={item.recipe.id} item={item} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (8.6%)</Text>
          <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
        <Button
          title={`Checkout — $${total.toFixed(2)}`}
          onPress={() => router.push('/checkout')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: spacing.xl },
  backBtn: { position: 'absolute', top: 60, left: spacing.xl },
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
  clearText: { color: colors.error, fontSize: font.size.sm, fontWeight: font.weight.medium },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.lg },
  emptyTitle: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary },
  emptySubtitle: { fontSize: font.size.md, color: colors.textMuted, marginTop: spacing.xs },
  list: { flex: 1, paddingHorizontal: spacing.xl },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: { width: 60, height: 60, borderRadius: radius.sm },
  itemImagePlaceholder: { backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, marginLeft: spacing.md },
  itemName: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  itemPrice: { fontSize: font.size.sm, color: colors.green, fontWeight: font.weight.medium, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bgAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  qtyText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary, minWidth: 20, textAlign: 'center' },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { fontSize: font.size.md, color: colors.textMuted },
  summaryValue: { fontSize: font.size.md, color: colors.textPrimary },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  totalLabel: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.textPrimary },
  totalValue: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.green },
});
