import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { fetchProfile, updateProfile } from '@/lib/queries';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchProfile(user.id);
      setProfile(data);
      setFirstName(data?.first_name || '');
      setLastName(data?.last_name || '');
      setPhone(data?.phone || '');
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { first_name: firstName, last_name: lastName, phone });
      setEditing(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.green} /></View>;
  }

  const menuItems = [
    { label: 'Saved Addresses', emoji: '📍', onPress: () => router.push('/addresses') },
    { label: 'Achievements', emoji: '🏆', onPress: () => router.push('/(tabs)/rewards') },
    { label: 'Referrals', emoji: '🎁', onPress: () => router.push('/referrals') },
    { label: 'Donations', emoji: '❤️', onPress: () => router.push('/donations') },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.green} />}
    >
      <Text style={styles.title}>Account</Text>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(firstName || user?.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {firstName && lastName ? `${firstName} ${lastName}` : user?.email}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <Pressable onPress={() => setEditing(!editing)}>
          <Text style={styles.editLink}>{editing ? 'Cancel' : 'Edit'}</Text>
        </Pressable>
      </View>

      {editing && (
        <View style={styles.editForm}>
          <Input label="First Name" value={firstName} onChangeText={setFirstName} />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Button title="Save Changes" onPress={handleSave} loading={saving} />
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <Pressable key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <Text style={styles.menuEmoji}>{item.emoji}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Sign Out */}
      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 60, paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.textPrimary, marginBottom: spacing.xl },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.green,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.textWhite },
  profileInfo: { flex: 1, marginLeft: spacing.md },
  profileName: { fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.textPrimary },
  profileEmail: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  editLink: { color: colors.green, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  editForm: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  menuSection: { marginTop: spacing.xl },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  menuEmoji: { fontSize: 20, marginRight: spacing.md },
  menuLabel: { flex: 1, fontSize: font.size.md, color: colors.textPrimary, fontWeight: font.weight.medium },
  menuArrow: { fontSize: font.size.xl, color: colors.textFaint },
  signOutBtn: {
    marginTop: spacing['2xl'], backgroundColor: colors.errorBg, borderRadius: radius.md,
    padding: spacing.lg, alignItems: 'center',
  },
  signOutText: { color: colors.error, fontSize: font.size.md, fontWeight: font.weight.semibold },
});
