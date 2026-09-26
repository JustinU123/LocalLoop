import { StyleSheet, Text, View } from 'react-native';

import { IntelligenceSparkleTitle } from '@/components/business/analytics/intelligence/intelligence-sparkle-title';
import { PremiumMetricTile } from '@/components/business/analytics/premium/premium-metric-tile';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import type { LocalMarketIntelligenceData } from '@/types/analytics-intelligence-data';
type LocalMarketIntelligencePanelProps = {
  access: AnalyticsFeatureAccess;
  data: LocalMarketIntelligenceData;
};

export function LocalMarketIntelligencePanel({ access, data }: LocalMarketIntelligencePanelProps) {
  const styles = useThemedStyles(createStyles);
  const { benchmark } = data;

  return (
    <View style={styles.root}>
      <IntelligenceSparkleTitle
        title="Local market intelligence"
        subtitle="Learn from aggregated public patterns and public content"
      />

      <AnalyticsSectionHeader title="Local benchmark" />
      <View style={styles.metricGrid}>
        <PremiumMetricTile
          access={access}
          label="Typical engagement range"
          icon="pulse-outline"
          tone="teal"
          metric={benchmark.engagementRange}
        />
        <PremiumMetricTile
          access={access}
          label="Posting frequency"
          icon="calendar-outline"
          tone="emerald"
          metric={benchmark.postingFrequency}
        />
        <PremiumMetricTile
          access={access}
          label="Category activity"
          icon="grid-outline"
          tone="coral"
          metric={benchmark.categoryActivity}
        />
        <PremiumMetricTile
          access={access}
          label="Relative public patterns"
          icon="analytics-outline"
          tone="amber"
          metric={benchmark.relativePatterns}
        />
      </View>

      <AnalyticsSectionHeader
        title="Similar businesses"
        subtitle="Relevant peers for context — not a leaderboard."
      />
      {data.similarBusinesses.map((biz) => (
        <View key={biz.id} style={styles.placeholderRow}>
          <Text style={styles.placeholderTitle}>{biz.name}</Text>
          <Text style={styles.placeholderMeta}>
            {biz.state === 'loading'
              ? '…'
              : `${biz.categoryLabel} — matches appear when category data is available.`}
          </Text>
        </View>
      ))}

      <AnalyticsSectionHeader
        title="Top-performing public content"
        subtitle="Up to three public examples to learn formats and themes — not to duplicate."
      />
      {data.publicContentExamples.map((example) => (
        <View key={example.id} style={styles.publicCard}>
          <Text style={styles.publicLabel}>{example.businessLabel}</Text>
          <Text style={styles.publicCaption}>
            {example.state === 'loading'
              ? '…'
              : 'Public post examples appear when anonymized local content signals exist.'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 14,
      width: '100%',
      minWidth: 0,
      alignSelf: 'stretch',
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    placeholderRow: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 12,
      gap: 4,
    },
    placeholderTitle: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    placeholderMeta: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: BrandFonts.regular,
    },
    publicCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 12,
      gap: 4,
    },
    publicLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    publicCaption: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
  });
}
