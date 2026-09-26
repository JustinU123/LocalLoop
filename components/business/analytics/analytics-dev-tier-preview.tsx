import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsPlanTier } from '@/types/analytics-access';
import { setAnalyticsDevTierOverride } from '@/utils/analytics-dev-tier-preview';

const DEV_TIER_OPTIONS: { tier: AnalyticsPlanTier | null; label: string }[] = [
  { tier: null, label: 'Production default (Basic)' },
  { tier: 'premium', label: 'Preview Premium' },
  { tier: 'pro', label: 'Preview Pro' },
];

export function AnalyticsDevTierPreview() {
  const styles = useThemedStyles(createStyles);
  const { tier } = useAnalyticsAccess();

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Developer only</Text>
      <Text style={styles.title}>Analytics tier preview</Text>
      <Text style={styles.copy}>
        In-memory override for QA. Not persisted. Ignored in production builds.
      </Text>
      <Text style={styles.active}>Active tier: {tier}</Text>
      <View style={styles.row}>
        {DEV_TIER_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            onPress={() => setAnalyticsDevTierOverride(option.tier)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            accessibilityRole="button">
            <Text style={styles.chipText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      padding: 14,
      gap: 8,
    },
    eyebrow: {
      color: theme.textMuted,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    copy: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: BrandFonts.regular,
    },
    active: {
      color: theme.emerald,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    row: {
      gap: 8,
      marginTop: 4,
    },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipPressed: {
      opacity: 0.9,
    },
    chipText: {
      color: theme.text,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
  });
}
