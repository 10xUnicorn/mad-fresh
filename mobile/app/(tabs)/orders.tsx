import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '@/theme';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <Text style={styles.subtitle}>Placeholder — built in Phase E</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: font.size.md, color: colors.textMuted, marginTop: 8 },
});
