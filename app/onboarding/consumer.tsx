import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { setOnboardingComplete } from '@/utils/onboarding-storage';

const CATEGORIES = ['Food', 'Coffee', 'Clothing', 'Beauty', 'Fitness', 'More'];

export default function ConsumerOnboardingScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['Coffee', 'Food']));

  const toggleCategory = (category: string) => {
    Haptics.selectionAsync();
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const finishOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(450)}>
          <Text style={styles.eyebrow}>Almost there</Text>
          <Text style={styles.title}>Personalize your feed</Text>
          <Text style={styles.subtitle}>
            Enable location to discover nearby spots and pick the categories you care about.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.section}>
          <Text style={styles.sectionTitle}>Location access</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLocationEnabled((value) => !value);
            }}
            style={[styles.locationCard, locationEnabled && styles.locationCardActive]}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={22} color={locationEnabled ? theme.onEmerald : theme.emerald} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationTitle}>
                {locationEnabled ? 'Location enabled' : 'Enable location'}
              </Text>
              <Text style={styles.locationSubtitle}>
                Find businesses near you in Los Angeles
              </Text>
            </View>
            <Ionicons
              name={locationEnabled ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={locationEnabled ? theme.emerald : theme.textMuted}
            />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(450)} style={styles.section}>
          <Text style={styles.sectionTitle}>Category interests</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((category) => {
              const selected = selectedCategories.has(category);
              return (
                <Pressable
                  key={category}
                  onPress={() => toggleCategory(category)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.footer}>
          <Pressable
            onPress={finishOnboarding}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.primaryButtonText}>Continue to LocalLoop</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.onEmerald} />
          </Pressable>
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
      marginBottom: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      marginBottom: 12,
    },
    locationCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      ...theme.shadowCard,
    },
    locationCardActive: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    locationIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    locationText: {
      flex: 1,
      gap: 2,
    },
    locationTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
    },
    locationSubtitle: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    chipsWrap: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    chipSelected: {
      backgroundColor: theme.emerald,
      borderColor: theme.emerald,
    },
    chipText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    chipTextSelected: {
      color: theme.onEmerald,
    },
    footer: {
      marginTop: 'auto' as const,
      paddingBottom: 16,
    },
    primaryButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.emerald,
      ...theme.shadowButton,
    },
    primaryButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    primaryButtonText: {
      color: theme.onEmerald,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
  });
}
