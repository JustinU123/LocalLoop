import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PremiumMetricValue } from '@/components/business/analytics/premium/premium-metric-value';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess, AnalyticsMetricState } from '@/types/analytics-access';
import { getAnalyticsVisualTone, type AnalyticsVisualTone } from '@/utils/analytics-visual-tones';

type PremiumMetricTileProps = {
  access: AnalyticsFeatureAccess;
  label: string;
  metric: AnalyticsMetricState;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: AnalyticsVisualTone;
};

export function PremiumMetricTile({
  access,
  label,
  metric,
  icon,
  tone = 'emerald',
}: PremiumMetricTileProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const colors = getAnalyticsVisualTone(theme, tone);

  return (
    <View style={styles.tile}>
      <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={18} color={colors.foreground} />
      </View>
      <PremiumMetricValue access={access} metric={metric} />
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 12,
      gap: 6,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
      lineHeight: 16,
    },
  });
}
