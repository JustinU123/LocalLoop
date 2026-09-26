import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AnalyticsMetricCard } from '@/components/business/analytics/analytics-metric-card';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type ProAudiencePanelProps = {
  loading: boolean;
  totalFollowers: number | null;
  followersFailed: boolean;
};

export function ProAudiencePanel({ loading, totalFollowers, followersFailed }: ProAudiencePanelProps) {
  const styles = useThemedStyles(createStyles);
  const followerValue = followersFailed ? '—' : loading ? '…' : String(totalFollowers ?? 0);

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Audience"
        subtitle="First-party audience signals only — no sensitive demographics."
      />

      <AnalyticsMetricCard
        label="Total followers"
        icon="people-outline"
        iconTone="emerald"
        value={followerValue}
        availability="ready"
        loading={loading && !followersFailed}
        variant="hero"
      />

      {followersFailed ? (
        <Text style={styles.errorText}>Follower count could not be loaded right now.</Text>
      ) : (
        <Text style={styles.footnote}>
          LocalLoop does not collect age, gender, income, or other demographic data. Follower
          identities are not exposed to businesses.
        </Text>
      )}

      <AnalyticsSectionHeader
        title="Follower growth"
        subtitle="Period growth appears when follow events can be aggregated for your business."
      />
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderLabel}>Growth (period)</Text>
        <Text style={styles.placeholderValue}>—</Text>
        <Text style={styles.placeholderHint}>Follower trend reporting is not live yet.</Text>
      </View>

      <AnalyticsSectionHeader title="Growth over time" />
      <View style={styles.chartCard}>
        <Text style={styles.unavailableCopy}>
          Your follower growth trend will appear here when historical follow data is available.
        </Text>
      </View>

      <AnalyticsSectionHeader
        title="Returning vs new engagement"
        subtitle="Mix of repeat and first-time engagement — no individual identities."
      />
      <View style={styles.metricRow}>
        <View style={styles.placeholderCardHalf}>
          <Text style={styles.placeholderLabel}>Returning engagement</Text>
          <Text style={styles.placeholderValue}>—</Text>
        </View>
        <View style={styles.placeholderCardHalf}>
          <Text style={styles.placeholderLabel}>New engagement</Text>
          <Text style={styles.placeholderValue}>—</Text>
        </View>
      </View>

      <AnalyticsSectionHeader title="When your audience engages" />
      <View style={styles.chartCard}>
        {loading ? (
          <ActivityIndicator size="small" color={styles.loader.color} />
        ) : (
          <Text style={styles.unavailableCopy}>
            Day and time breakdowns will appear when engagement timestamps are available for analytics.
          </Text>
        )}
      </View>

      <AnalyticsSectionHeader title="Audience activity patterns" />
      <View style={styles.chartCard}>
        <Text style={styles.unavailableCopy}>
          Activity patterns will summarize legitimate in-app signals when enough history exists.
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 16,
    },
    footnote: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
      paddingHorizontal: 4,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      paddingHorizontal: 4,
    },
    placeholderCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 6,
    },
    placeholderCardHalf: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 6,
    },
    placeholderLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
    placeholderValue: {
      color: theme.textSecondary,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
    },
    placeholderHint: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: BrandFonts.regular,
    },
    chartCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      minHeight: 88,
      justifyContent: 'center',
    },
    metricRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    unavailableCopy: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    loader: {
      color: theme.emerald,
    },
  });
}
