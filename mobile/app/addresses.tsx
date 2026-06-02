import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { fetchAddresses, createAddress, deleteAddress, setDefaultAddress } from '@/lib/queries';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function AddressesScreen() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [instructions, setInstructions] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchAddresses(user.id);
      setAddresses(data);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!user || !label.trim() || !line1.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      await createAddress(user.id, {
        label: label.trim(),
        address_line1: line1.trim(),
        address_line2: line2.trim() || null,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zip_code: zip.trim(),
        delivery_instructions: instructions.trim() || null,
        is_default: addresses.length === 0,
      });
      setShowForm(false);
      setLabel(''); setLine1(''); setLine2(''); setCity(''); setState(''); setZip(''); setInstructions('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save address');
    }
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAddress(id);
          load();
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await setDefaultAddress(user.id, id);
    load();
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Addresses</Text>
        <Pressable onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showForm && (
          <View style={styles.form}>
            <Input label="Label" placeholder="Home, Work, etc." value={label} onChangeText={setLabel} />
            <Input label="Address Line 1" placeholder="Street address" value={line1} onChangeText={setLine1} />
            <Input label="Address Line 2" placeholder="Apt, Suite (optional)" value={line2} onChangeText={setLine2} />
            <View style={styles.row}>
              <View style={{ flex: 2 }}><Input label="City" value={city} onChangeText={setCity} /></View>
              <View style={{ flex: 1 }}><Input label="State" placeholder="AZ" value={state} onChangeText={setState} /></View>
              <View style={{ flex: 1 }}><Input label="ZIP" value={zip} onChangeText={setZip} keyboardType="number-pad" /></View>
            </View>
            <Input label="Delivery Instructions" placeholder="Gate code, ring bell, etc." value={instructions} onChangeText={setInstructions} />
            <Button title="Save Address" onPress={handleAdd} loading={saving} />
          </View>
        )}

        {addresses.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptySubtitle}>Add a delivery address to get started</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressLabelRow}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  {addr.is_default && <Text style={styles.defaultBadge}>Default</Text>}
                </View>
                <View style={styles.addressActions}>
                  {!addr.is_default && (
                    <Pressable onPress={() => handleSetDefault(addr.id)}>
                      <Text style={styles.setDefaultText}>Set Default</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleDelete(addr.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.addressText}>{addr.address_line1}</Text>
              {addr.address_line2 && <Text style={styles.addressText}>{addr.address_line2}</Text>}
              <Text style={styles.addressText}>{addr.city}, {addr.state} {addr.zip_code}</Text>
              {addr.delivery_instructions && (
                <Text style={styles.instructions}>Note: {addr.delivery_instructions}</Text>
              )}
            </View>
          ))
        )}
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
  title: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textPrimary },
  backText: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.semibold },
  addText: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.semibold },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  form: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  empty: { alignItems: 'center', paddingTop: spacing['4xl'] },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary, marginTop: spacing.md },
  emptySubtitle: { fontSize: font.size.md, color: colors.textMuted, marginTop: spacing.xs },
  addressCard: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addressLabel: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textPrimary },
  defaultBadge: {
    fontSize: font.size.xs, color: colors.green, backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, fontWeight: font.weight.semibold,
  },
  addressActions: { flexDirection: 'row', gap: spacing.md },
  setDefaultText: { fontSize: font.size.xs, color: colors.green, fontWeight: font.weight.medium },
  deleteText: { fontSize: font.size.xs, color: colors.error, fontWeight: font.weight.medium },
  addressText: { fontSize: font.size.sm, color: colors.textSecondary, lineHeight: 20 },
  instructions: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
});
