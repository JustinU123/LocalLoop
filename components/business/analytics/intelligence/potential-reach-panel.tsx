import { StyleSheet, Text, View } from 'react-native';

import { IntelligenceSparkleTitle } from '@/components/business/analytics/intelligence/intelligence-sparkle-title';
import { PremiumMetricValue } from '@/components/business/analytics/premium/premium-metric-value';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import type { PotentialReachData } from '@/types/analytics-intelligence-data';
import { getIntelligenceTheme } from '@/utils/analytics-intelligence-theme';

type PotentialReachPanelProps = {
  access: AnalyticsFeatureAccess;
  data: PotentialReachData;
};

export function PotentialReachPanel({ access, data }: PotentialReachPanelProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const intelligence = getIntelligenceTheme(theme);

  return (
    <View style={styles.root}>
      <IntelligenceSparkleTitle
        title="Potential Reach"
        subtitle="Compare current local visibility with unrealized opportunity — not a vanity reach score."
      />

      <View style={[styles.meterCard, { borderColor: intelligence.border }]}>
        <View style={styles.reachRow}>
          <View style={styles.reachCol}>
            <Text style={styles.reachLabel}>Current reach</Text>
            <PremiumMetricValue access={access} metric={data.currentReach} size="large" />
          </View>
          <View style={styles.vs}>
            <Text style={styles.vsText}>vs</Text>
          </View>
          <View style={styles.reachCol}>
            <Text style={styles.reachLabel}>Potential reach</Text>
            <PremiumMetricValue access={access} metric={data.potentialReach} size="large" />
          </View>
        </View>

        <View style={[styles.meterTrack, { backgroundColor: intelligence.backgroundElevated }]}>
          <View
            style={[
              styles.meterFillCurrent,
              { backgroundColor: intelligence.foreground, opacity: access === 'locked' ? 0.35 : 0.5 },
            ]}
          />
          <View
            style={[
              styles.meterFillPotential,
              { borderColor: intelligence.border },
            ]}
          />
        </View>
        <Text style={styles.meterCaption}>
          {data.meterState === 'loading'
            ? 'Loading reach comparison…'
            : 'Reach comparison unavailable until local demand signals are collected.'}
        </Text>
      </View>

      <AnalyticsSectionHeader
        title="How to increase your reach"
        subtitle="Actionable guidance — not pay-for-impressions boosting."
      />
      <View style={styles.recList}>
        {data.recommendations.map((rec) => (
          <View key={rec.id} style={styles.recCard}>
            <Text style={styles.recTitle}>{rec.title}</Text>
            <Text style={styles.recBody}>{rec.description}</Text>
            <Text style={styles.recState}>
              {rec.state === 'loading' ? '…' : 'Recommendation unavailable without supporting data.'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 14,
    },
    meterCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      padding: 16,
      gap: 12,
    },
    reachRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    reachCol: {
      flex: 1,
      gap: 4,
    },
    reachLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    vs: {
      paddingHorizontal: 8,
      paddingTop: 18,
    },
    vsText: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
    meterTrack: {
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative',
    },
    meterFillCurrent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '38%',
      borderRadius: 6,
    },
    meterFillPotential: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 6,
      borderWidth: 1,
      borderStyle: 'dashed',
      opacity: 0.6,
    },
    meterCaption: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: BrandFonts.regular,
    },
    recList: {
      gap: 8,
    },
    recCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 6,
    },
    recTitle: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    recBody: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    recState: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
  });
}
