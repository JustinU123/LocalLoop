import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandFonts, BrandShadow, BusinessTheme as T } from '@/constants/business-theme';
import { setOnboardingComplete } from '@/utils/onboarding-storage';

const CATEGORIES = ['Food', 'Coffee', 'Clothing', 'Beauty', 'Fitness', 'More'];

export default function ConsumerOnboardingScreen() {
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
              <Ionicons name="location" size={22} color={locationEnabled ? T.onEmerald : T.emerald} />
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
              color={locationEnabled ? T.emerald : T.textMuted}
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
            <Ionicons name="arrow-forward" size={18} color={T.onEmerald} />
          </Pressable>
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
  },
  eyebrow: {
    color: T.emerald,
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
  },
  locationCardActive: {
    borderColor: T.emerald,
    backgroundColor: T.emeraldGlow,
  },
  locationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: '700',
  },
  locationSubtitle: {
    color: T.textSecondary,
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.borderLight,
  },
  chipSelected: {
    backgroundColor: T.emerald,
    borderColor: T.emerald,
  },
  chipText: {
    color: T.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: T.onEmerald,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: T.emerald,
    ...BrandShadow.button,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: T.onEmerald,
    fontSize: 16,
    fontFamily: BrandFonts.bold,
  },
});
