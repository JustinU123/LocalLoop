import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/onboarding/local-loop-wordmark';
import { BusinessTheme as T } from '@/constants/business-theme';

function AuthButton({
  label,
  icon,
  variant,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: 'apple' | 'google' | 'email';
  onPress: () => void;
}) {
  const isApple = variant === 'apple';
  const isGoogle = variant === 'google';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.authButton,
        isApple && styles.authButtonApple,
        isGoogle && styles.authButtonGoogle,
        variant === 'email' && styles.authButtonEmail,
        pressed && styles.authButtonPressed,
      ]}>
      <Ionicons
        name={icon}
        size={20}
        color={isApple ? '#FFFFFF' : isGoogle ? T.text : T.emerald}
      />
      <Text
        style={[
          styles.authButtonText,
          isApple && styles.authButtonTextApple,
          isGoogle && styles.authButtonTextGoogle,
          variant === 'email' && styles.authButtonTextEmail,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const openEmailAuth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/email');
  };

  const showPlaceholderAuth = (provider: 'Apple' | 'Google') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming soon', `${provider} sign-in will be available soon.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <LocalLoopWordmark size="medium" />
          <Text style={styles.tagline}>Helping local businesses get discovered.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.actions}>
          <AuthButton
            label="Continue with Apple"
            icon="logo-apple"
            variant="apple"
            onPress={() => showPlaceholderAuth('Apple')}
          />
          <AuthButton
            label="Continue with Google"
            icon="logo-google"
            variant="google"
            onPress={() => showPlaceholderAuth('Google')}
          />
          <AuthButton
            label="Continue with Email"
            icon="mail-outline"
            variant="email"
            onPress={openEmailAuth}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  tagline: {
    color: T.textSecondary,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    gap: 12,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
  },
  authButtonApple: {
    backgroundColor: '#FFFFFF',
  },
  authButtonGoogle: {
    backgroundColor: T.surfaceElevated,
    borderWidth: 1,
    borderColor: T.borderLight,
  },
  authButtonEmail: {
    backgroundColor: T.emeraldGlow,
    borderWidth: 1,
    borderColor: T.emerald,
  },
  authButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  authButtonTextApple: {
    color: '#000000',
  },
  authButtonTextGoogle: {
    color: T.text,
  },
  authButtonTextEmail: {
    color: T.emerald,
  },
});
