import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors, font, spacing, radius } from '@/theme';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: authError } = await resetPassword(email.trim());
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <Text style={styles.successEmoji}>📧</Text>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.sentText}>
          If an account exists for {email}, you'll receive a password reset link.
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/mad-fresh-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <Button title="Send Reset Link" onPress={handleReset} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centeredContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['4xl'],
  },
  backBtn: { marginBottom: spacing.xl },
  backText: { color: colors.green, fontSize: font.size.md, fontWeight: font.weight.medium },
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
  successEmoji: { fontSize: 48, marginBottom: spacing.lg },
  sentText: {
    fontSize: font.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
});
