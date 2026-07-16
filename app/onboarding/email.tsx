import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/onboarding/local-loop-wordmark';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { signInWithEmail, signOutUser, signUpWithEmail } from '@/utils/auth';
import { routeAfterAuthentication } from '@/utils/auth-navigation';
import {
  getAuthErrorMessage,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '@/utils/auth-validation';

type AuthMode = 'sign-in' | 'sign-up';

export default function EmailAuthScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isSignUp = mode === 'sign-up';

  const switchMode = (nextMode: AuthMode) => {
    Haptics.selectionAsync();
    setMode(nextMode);
    setErrorMessage(null);
    setInfoMessage(null);
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.message);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrorMessage(passwordValidation.message);
      return;
    }

    if (isSignUp) {
      const confirmValidation = validatePasswordConfirmation(password, confirmPassword);
      if (!confirmValidation.valid) {
        setErrorMessage(confirmValidation.message);
        return;
      }
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password);

        if (error) {
          setErrorMessage(getAuthErrorMessage(error));
          return;
        }

        if (!data.session) {
          setInfoMessage('Check your email to confirm your account, then sign in.');
          switchMode('sign-in');
          return;
        }

        await routeAfterAuthentication(data.user);
        return;
      }

      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      await routeAfterAuthentication(data.user);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const { error } = await signOutUser();
      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      setInfoMessage('You have been signed out.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setErrorMessage('Unable to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.hero}>
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
            <LocalLoopWordmark size="medium" />
            <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Sign up with email to continue setting up LocalLoop.'
                : 'Sign in with your email to continue.'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.form}>
            <View style={styles.modeSwitch}>
              <Pressable
                onPress={() => switchMode('sign-in')}
                style={[styles.modeButton, !isSignUp && styles.modeButtonActive]}>
                <Text style={[styles.modeButtonText, !isSignUp && styles.modeButtonTextActive]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode('sign-up')}
                style={[styles.modeButton, isSignUp && styles.modeButtonActive]}>
                <Text style={[styles.modeButtonText, isSignUp && styles.modeButtonTextActive]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                textContentType={isSignUp ? 'newPassword' : 'password'}
                style={styles.input}
              />
            </View>

            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry
                  textContentType="newPassword"
                  style={styles.input}
                />
              </View>
            )}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || loading) && styles.primaryButtonPressed,
                loading && styles.primaryButtonDisabled,
              ]}>
              {loading ? (
                <ActivityIndicator color={theme.onEmerald} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.onEmerald} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}>
              {signingOut ? (
                <ActivityIndicator color={theme.textSecondary} size="small" />
              ) : (
                <Text style={styles.signOutText}>Sign Out</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: BrandFonts.regular,
    textAlign: 'center',
    maxWidth: 320,
  },
  form: {
    gap: 14,
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  modeButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: theme.emeraldGlow,
    borderColor: theme.emerald,
  },
  modeButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: theme.emerald,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    color: theme.text,
    fontSize: 16,
  },
  errorText: {
    color: theme.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  infoText: {
    color: theme.emerald,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.emerald,
    marginTop: 4,
    ...theme.shadowButton,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: theme.onEmerald,
    fontSize: 16,
    fontFamily: BrandFonts.bold,
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signOutButtonPressed: {
    opacity: 0.75,
  },
  signOutText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  });
}
