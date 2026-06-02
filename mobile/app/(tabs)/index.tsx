import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '@/theme';
import { useAuth } from '@/lib/auth';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <Text style={styles.placeholder}>Dashboard — built in Phase E</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60 },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing['2xl'] },
  greeting: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary },
  email: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 4 },
  placeholder: { fontSize: font.size.md, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
