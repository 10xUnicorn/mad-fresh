import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.subtitle}>Placeholder — built in Phase E</Text>
      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary },
  email: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 4 },
  subtitle: { fontSize: font.size.md, color: colors.textMuted, marginTop: 8 },
  signOutBtn: {
    marginTop: spacing['3xl'],
    backgroundColor: colors.errorBg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  signOutText: { color: colors.error, fontWeight: font.weight.semibold, fontSize: font.size.md },
});
