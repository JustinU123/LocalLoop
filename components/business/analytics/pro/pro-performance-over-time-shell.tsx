import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsTimeRangeId } from '@/types/analytics-time-range';
import { getAnalyticsTimeRangeDefinition } from '@/utils/analytics-time-range';

type ProPerformanceOverTimeShellProps = {
  selectedRangeId: AnalyticsTimeRangeId;
};

export function ProPerformanceOverTimeShell({ selectedRangeId }: ProPerformanceOverTimeShellProps) {
  const styles = useThemedStyles(createStyles);
  const range = getAnalyticsTimeRangeDefinition(selectedRangeId);
  const trendPhrase = trendLabelForRange(selectedRangeId);

  return (
    <View style={styles.root}>
      <View style={styles.chartArea}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="analytics-outline" size={24} color={styles.chartIcon.color} />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Performance over time</Text>
        <Text style={styles.message}>
          Your {trendPhrase} will appear here when first-party performance tracking is available.
        </Text>
        <Text style={styles.rangeNote}>Selected range: {range.pillLabel}</Text>
      </View>
    </View>
  );
}

function trendLabelForRange(id: AnalyticsTimeRangeId): string {
  switch (id) {
    case '1d':
      return '24-hour trend';
    case '7d':
      return '7-day trend';
    case '1m':
      return '30-day trend';
    case '3m':
      return '3-month trend';
    case '6m':
      return '6-month trend';
    case '1y':
      return 'year-long trend';
    default:
      return 'trend';
  }
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      padding: 16,
      gap: 14,
    },
    chartArea: {
      height: 148,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartIcon: {
      color: theme.emerald,
    },
    copy: {
      gap: 6,
      paddingHorizontal: 2,
    },
    title: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    message: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    rangeNote: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
    },
  });
}
