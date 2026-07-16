import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StyleSheet, Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/onboarding/local-loop-wordmark';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

function AuthButton({
  label,
  icon,
  variant,
  onPress,
  theme,
  styles,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: 'apple' | 'google' | 'email';
  onPress: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
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
        color={isApple ? (theme.isDark ? '#111111' : '#FFFFFF') : isGoogle ? theme.text : theme.onEmerald}
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
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

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
            theme={theme}
            styles={styles}
          />
          <AuthButton
            label="Continue with Google"
            icon="logo-google"
            variant="google"
            onPress={() => showPlaceholderAuth('Google')}
            theme={theme}
            styles={styles}
          />
          <AuthButton
            label="Continue with Email"
            icon="mail-outline"
            variant="email"
            onPress={openEmailAuth}
            theme={theme}
            styles={styles}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'space-between' as const,
      paddingTop: 48,
      paddingBottom: 32,
    },
    hero: {
      alignItems: 'center' as const,
      gap: 16,
      marginTop: 40,
    },
    tagline: {
      color: theme.textSecondary,
      fontSize: 17,
      lineHeight: 26,
      fontFamily: BrandFonts.regular,
      textAlign: 'center' as const,
      maxWidth: 280,
    },
    actions: {
      gap: 12,
    },
    authButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 10,
      height: 52,
      borderRadius: 14,
    },
    authButtonApple: {
      backgroundColor: theme.isDark ? '#FFFFFF' : '#111111',
    },
    authButtonGoogle: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      ...theme.shadowCard,
    },
    authButtonEmail: {
      backgroundColor: theme.emerald,
      ...theme.shadowButton,
    },
    authButtonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    authButtonText: {
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    authButtonTextApple: {
      color: theme.isDark ? '#111111' : '#FFFFFF',
    },
    authButtonTextGoogle: {
      color: theme.text,
    },
    authButtonTextEmail: {
      color: theme.onEmerald,
    },
  });
}
