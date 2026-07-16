import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandFonts, BrandShadow, BusinessTheme as T } from '@/constants/business-theme';
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

function AccountOptionCard({ option }: { option: AccountOption }) {
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
        <Ionicons name={option.icon} size={28} color={T.emerald} />
      </View>
      <Text style={styles.optionTitle}>{option.title}</Text>
      <Text style={styles.optionDescription}>{option.description}</Text>
      <View style={styles.optionChevron}>
        <Ionicons name="arrow-forward" size={18} color={T.emerald} />
      </View>
    </Pressable>
  );
}

export default function AccountTypeScreen() {
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
            <AccountOptionCard key={option.id} option={option} />
          ))}
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
    paddingTop: 24,
    gap: 28,
  },
  eyebrow: {
    color: T.emerald,
    fontSize: 12,
    fontFamily: BrandFonts.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: T.text,
    fontSize: 28,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: T.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: BrandFonts.regular,
  },
  options: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: T.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
    gap: 10,
    ...BrandShadow.card,
  },
  optionCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  optionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.emeraldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    color: T.text,
    fontSize: 18,
    fontFamily: BrandFonts.bold,
  },
  optionDescription: {
    color: T.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: BrandFonts.regular,
    paddingRight: 24,
  },
  optionChevron: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});
