import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { updateUserAccountType } from '@/utils/auth';
import { getOnboardingRouteForAccountType } from '@/utils/auth-navigation';

type AccountOption = {
  id: 'consumer' | 'business';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: '/onboarding/consumer' | '/onboarding/business';
};

const OPTIONS: AccountOption[] = [
  {
    id: 'consumer',
    title: 'Discover Local Businesses',
    description: 'Find coffee shops, restaurants, boutiques, and hidden gems near you.',
    icon: 'compass-outline',
    route: '/onboarding/consumer',
  },
  {
    id: 'business',
    title: 'Promote My Business',
    description: 'Create a profile, share promotions, and reach nearby customers.',
    icon: 'storefront-outline',
    route: '/onboarding/business',
  },
];

function AccountOptionCard({
  option,
  theme,
  styles,
}: {
  option: AccountOption;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      const { error } = await updateUserAccountType(option.id);
      if (error) {
        Alert.alert('Unable to save account type', error.message);
        return;
      }

      router.push(getOnboardingRouteForAccountType(option.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}>
      <View style={styles.optionIconWrap}>
        <Ionicons name={option.icon} size={28} color={theme.emerald} />
      </View>
      <Text style={styles.optionTitle}>{option.title}</Text>
      <Text style={styles.optionDescription}>{option.description}</Text>
      <View style={styles.optionChevron}>
        <Ionicons name="arrow-forward" size={18} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

export default function AccountTypeScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(450)}>
          <Text style={styles.eyebrow}>Get started</Text>
          <Text style={styles.title}>What brings you to LocalLoop?</Text>
          <Text style={styles.subtitle}>Choose the experience that fits you best.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.options}>
          {OPTIONS.map((option) => (
            <AccountOptionCard key={option.id} option={option} theme={theme} styles={styles} />
          ))}
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
      paddingTop: 24,
      gap: 28,
    },
    eyebrow: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.bold,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
      marginBottom: 8,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: BrandFonts.regular,
    },
    options: {
      gap: 16,
    },
    optionCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 10,
      ...theme.shadowCard,
    },
    optionCardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    optionIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    optionTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
    },
    optionDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
      paddingRight: 24,
    },
    optionChevron: {
      position: 'absolute' as const,
      top: 20,
      right: 20,
    },
  });
}
