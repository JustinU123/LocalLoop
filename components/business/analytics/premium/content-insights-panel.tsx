import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ObscuredBlock } from '@/components/business/analytics/analytics-premium-obscured';
import { PremiumMetricTile } from '@/components/business/analytics/premium/premium-metric-tile';
import { PremiumMetricValue } from '@/components/business/analytics/premium/premium-metric-value';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsFeatureAccess } from '@/types/analytics-access';
import type { ContentInsightsData } from '@/types/analytics-premium-data';
import { getAnalyticsVisualTone } from '@/utils/analytics-visual-tones';

type ContentInsightsPanelProps = {
  access: AnalyticsFeatureAccess;
  engagementAccess: AnalyticsFeatureAccess;
  data: ContentInsightsData;
  /** When false, list shows recent posts without implying performance rank. */
  performanceTrackingAvailable?: boolean;
};

export function ContentInsightsPanel({
  access,
  engagementAccess,
  data,
  performanceTrackingAvailable = false,
}: ContentInsightsPanelProps) {
  const styles = useThemedStyles(createStyles);

  const postsSectionTitle = performanceTrackingAvailable
    ? 'Top-performing posts'
    : 'Your posts';
  const postsSectionSubtitle = performanceTrackingAvailable
    ? 'Ranked by engagement once post analytics are available.'
    : 'Recent posts from your profile. Performance rank unavailable until post analytics are collected.';

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader title={postsSectionTitle} subtitle={postsSectionSubtitle} />

      {data.topPosts.length === 0 ? (
        <Text style={styles.emptyCopy}>
          Publish posts to populate this ranking when analytics are enabled.
        </Text>
      ) : (
        <View style={styles.rankList}>
          {data.topPosts.map((post, index) => (
            <View key={post.id} style={styles.rankRow}>
              <Text style={styles.rankIndex}>{index + 1}</Text>
              {post.imageUri ? (
                <Image source={{ uri: post.imageUri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={18} color={styles.thumbIcon.color} />
                </View>
              )}
              <View style={styles.rankCopy}>
                <Text style={styles.rankTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.rankDate}>{post.postedAtLabel}</Text>
                <View style={styles.rankMetrics}>
                  <RankMetric access={access} icon="eye-outline" tone="emerald" metric={post.views} />
                  <RankMetric
                    access={access}
                    icon="bookmark-outline"
                    tone="amber"
                    metric={post.saves}
                  />
                  <RankMetric
                    access={engagementAccess}
                    icon="heart-outline"
                    tone="coral"
                    metric={post.likes}
                  />
                  <RankMetric
                    access={engagementAccess}
                    icon="chatbubble-outline"
                    tone="blue"
                    metric={post.comments}
                  />
                  <RankMetric
                    access={access}
                    icon="trending-up-outline"
                    tone="coral"
                    metric={post.engagement}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <AnalyticsSectionHeader title="Content intelligence" />
      <View style={styles.intelligenceGrid}>
        <PremiumMetricTile
          access={access}
          label="Best content format"
          icon="layers-outline"
          tone="emerald"
          metric={data.bestFormat}
        />
        <PremiumMetricTile
          access={access}
          label="Best posting times"
          icon="time-outline"
          tone="gold"
          metric={data.bestPostingTimes}
        />
        <PremiumMetricTile
          access={access}
          label="Posting cadence"
          icon="calendar-outline"
          tone="teal"
          metric={data.postingCadence}
        />
      </View>

      <View style={styles.opportunitiesCard}>
        <Text style={styles.opportunitiesTitle}>Content opportunities</Text>
        <Text style={styles.opportunitiesCopy}>
          Surface underserved local content gaps once regional demand signals exist.
        </Text>
        {access === 'locked' ? (
          <ObscuredBlock width="100%" height={48} />
        ) : data.opportunities === 'loading' ? (
          <ActivityIndicator size="small" color={styles.loader.color} />
        ) : (
          <Text style={styles.unavailable}>—</Text>
        )}
      </View>
    </View>
  );
}

function RankMetric({
  access,
  icon,
  tone,
  metric,
}: {
  access: AnalyticsFeatureAccess;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'emerald' | 'amber' | 'coral' | 'blue';
  metric: ContentInsightsData['topPosts'][number]['views'];
}) {
  const { theme } = useAppTheme();
  const colors = getAnalyticsVisualTone(theme, tone);

  return (
    <View style={[rankMetricStyles.chip, { backgroundColor: colors.background }]}>
      <Ionicons name={icon} size={12} color={colors.foreground} />
      <PremiumMetricValue access={access} metric={metric} size="chip" />
    </View>
  );
}

const rankMetricStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: BrandRadius.pill,
  },
});

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 14,
    },
    emptyCopy: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
      paddingHorizontal: 4,
    },
    rankList: {
      gap: 8,
    },
    rankRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 10,
    },
    rankIndex: {
      color: theme.emerald,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      width: 18,
      marginTop: 2,
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: BrandRadius.sm,
    },
    thumbPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbIcon: {
      color: theme.textMuted,
    },
    rankCopy: {
      flex: 1,
      gap: 4,
    },
    rankTitle: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      lineHeight: 18,
    },
    rankDate: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.regular,
    },
    rankMetrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    intelligenceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    opportunitiesCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 8,
    },
    opportunitiesTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    opportunitiesCopy: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    unavailable: {
      color: theme.textSecondary,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
    },
    loader: {
      color: theme.emerald,
    },
  });
}
