import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, font, spacing } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void; color?: string };
}

export function ScreenHeader({ title, showBack, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      {showBack ? (
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} hitSlop={8}>
          <Text style={[styles.actionText, rightAction.color ? { color: rightAction.color } : {}]}>
            {rightAction.label}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.textPrimary,
  },
  backText: {
    color: colors.green,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
  },
  actionText: {
    color: colors.green,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
  },
  placeholder: { width: 50 },
});
