import { StyleSheet, Text } from 'react-native';

import { ObscuredBlock } from '@/components/business/analytics/analytics-premium-obscured';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { analyticsPostMetricTextStyle } from '@/utils/analytics-post-metric-typography';
import type { AnalyticsFeatureAccess, AnalyticsMetricState } from '@/types/analytics-access';

type PremiumMetricValueProps = {
  access: AnalyticsFeatureAccess;
  metric: AnalyticsMetricState;
  size?: 'default' | 'large' | 'chip';
};

function formatMetricValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

export function PremiumMetricValue({ access, metric, size = 'default' }: PremiumMetricValueProps) {
  const styles = useThemedStyles(createStyles);

  if (access === 'locked') {
    return <ObscuredBlock width={size === 'large' ? 64 : 48} height={size === 'large' ? 16 : 12} />;
  }

  const valueStyle = [
    styles.value,
    size === 'large' && styles.valueLarge,
    size === 'chip' && styles.valueChip,
  ];

  if (metric.state === 'loading') {
    return <Text style={valueStyle}>…</Text>;
  }

  if (metric.state === 'unavailable') {
    return <Text style={valueStyle}>—</Text>;
  }

  return <Text style={valueStyle}>{formatMetricValue(metric.value)}</Text>;
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    value: {
      color: theme.text,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
    },
    valueLarge: {
      fontSize: 32,
      letterSpacing: -0.8,
    },
    valueChip: analyticsPostMetricTextStyle(theme),
  });
}
