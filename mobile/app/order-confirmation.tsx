import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { colors, font, spacing, radius } from '@/theme';
import { Button } from '@/components/Button';

export default function OrderConfirmationScreen() {
  const { orderNumber, total } = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    total: string;
  }>();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✅</Text>
      <Text style={styles.title}>Order Placed!</Text>
      {orderNumber && (
        <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
      )}
      {total && (
        <Text style={styles.total}>Total: ${total}</Text>
      )}
      <Text style={styles.message}>
        Your order is being prepared. You'll receive a notification when it's ready.
      </Text>

      <View style={styles.buttons}>
        <Button title="View Orders" onPress={() => router.replace('/(tabs)/orders')} />
        <Button title="Back to Menu" onPress={() => router.replace('/(tabs)/menu')} variant="outline" style={{ marginTop: spacing.md }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  checkmark: { fontSize: 64, marginBottom: spacing.xl },
  title: {
    fontSize: font.size['3xl'],
    fontWeight: font.weight.bold,
    color: colors.textPrimary,
  },
  orderNumber: {
    fontSize: font.size.lg,
    color: colors.green,
    fontWeight: font.weight.semibold,
    marginTop: spacing.sm,
  },
  total: {
    fontSize: font.size.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  message: {
    fontSize: font.size.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 24,
  },
  buttons: {
    width: '100%',
    marginTop: spacing['3xl'],
  },
});
