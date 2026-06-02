import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    const { error: authError } = await signUp(email.trim(), password, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <Text style={styles.successEmoji}>📧</Text>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.successText}>
          We sent a confirmation link to {email}. Tap it to activate your account.
        </Text>
        <Button
          title="Back to Sign In"
          onPress={() => router.replace('/(auth)/login')}
          variant="outline"
          style={{ marginTop: spacing['2xl'] }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/mad-fresh-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Mad Fresh Kitchen</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Input label="First Name" placeholder="First" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" />
          </View>
          <View style={styles.nameField}>
            <Input label="Last Name" placeholder="Last" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" />
          </View>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <Input
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChangeText={setPassword}
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Input
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Button title="Create Account" onPress={handleSignup} loading={loading} style={{ marginTop: spacing.sm }} />

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  successContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  logoContainer: { alignItems: 'center', marginBottom: spacing['2xl'] },
  logo: { width: 100, height: 100 },
  title: {
    fontSize: font.size['2xl'],
    fontWeight: font.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: font.size.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.error, fontSize: font.size.sm, textAlign: 'center' },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  nameField: { flex: 1 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  loginText: { color: colors.textMuted, fontSize: font.size.md },
  loginLink: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.semibold },
  successEmoji: { fontSize: 48, marginBottom: spacing.lg },
  successText: {
    fontSize: font.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
});
