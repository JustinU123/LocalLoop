import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsPlanTier } from '@/types/analytics-access';

type DashboardPlanTierPillProps = {
  tier: AnalyticsPlanTier;
};

const TIER_LABEL: Record<AnalyticsPlanTier, string> = {
  basic: 'BASIC',
  pro: 'PRO',
  premium: 'PREMIUM',
};

export function DashboardPlanTierPill({ tier }: DashboardPlanTierPillProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tone = getTierToneStyles(theme, tier);

  return (
    <View
      style={[styles.pill, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}
      accessibilityRole="text"
      accessibilityLabel={`Current plan: ${TIER_LABEL[tier]}`}>
      <Text style={[styles.label, { color: tone.textColor }]}>{TIER_LABEL[tier]}</Text>
    </View>
  );
}

function getTierToneStyles(
  theme: AppThemeTokens,
  tier: AnalyticsPlanTier,
): { backgroundColor: string; borderColor: string; textColor: string } {
  switch (tier) {
    case 'pro':
      return {
        backgroundColor: theme.isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 165, 233, 0.12)',
        borderColor: theme.isDark ? 'rgba(56, 189, 248, 0.32)' : 'rgba(14, 165, 233, 0.28)',
        textColor: theme.isDark ? '#7DD3FC' : '#0284C7',
      };
    case 'premium':
      return {
        backgroundColor: 'rgba(245, 197, 66, 0.14)',
        borderColor: 'rgba(245, 197, 66, 0.28)',
        textColor: theme.star,
      };
    default:
      return {
        backgroundColor: theme.surfaceElevated,
        borderColor: theme.border,
        textColor: theme.textSecondary,
      };
  }
}

function createStyles(_theme: AppThemeTokens) {
  return StyleSheet.create({
    pill: {
      borderWidth: 1,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 7,
      paddingVertical: 2,
      alignSelf: 'center',
    },
    label: {
      fontSize: 10,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 0.45,
    },
  });
}
