import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PremiumMetricValue } from '@/components/business/analytics/premium/premium-metric-value';
import { AnalyticsEmptyState } from '@/components/business/analytics/analytics-empty-state';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnalyticsMetricState } from '@/types/analytics-access';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';
import { buildProContentInsightsViewModel } from '@/utils/analytics-pro-view-model';
import { getAnalyticsVisualTone } from '@/utils/analytics-visual-tones';

type ProContentPanelProps = {
  loading: boolean;
  postsFailed: boolean;
  posts: BusinessPost[];
  engagement: BusinessPostEngagementSummary | null;
  engagementFailed: boolean;
};

export function ProContentPanel({
  loading,
  postsFailed,
  posts,
  engagement,
  engagementFailed,
}: ProContentPanelProps) {
  const styles = useThemedStyles(createStyles);
  const contentData = buildProContentInsightsViewModel(postsFailed ? [] : posts, loading, {
    summary: engagement,
    failed: engagementFailed,
  });

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Content performance"
        subtitle="Your posts with current engagement. Performance rank requires view and interaction events."
      />

      {loading && posts.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={styles.loader.color} />
        </View>
      ) : postsFailed ? (
        <AnalyticsEmptyState
          icon="cloud-offline-outline"
          title="Unable to load posts"
          message="Check your connection and open Analytics again."
        />
      ) : contentData.posts.length === 0 ? (
        <AnalyticsEmptyState
          icon="images-outline"
          title="No posts yet"
          message="Publish a photo or announcement to see content performance here."
        />
      ) : (
        <View style={styles.postList}>
          {contentData.posts.map((post, index) => (
            <View key={post.id} style={styles.postRow}>
              <Text style={styles.postIndex}>{index + 1}</Text>
              {post.imageUri ? (
                <Image source={{ uri: post.imageUri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="image-outline" size={18} color={styles.thumbIcon.color} />
                </View>
              )}
              <View style={styles.postCopy}>
                <Text style={styles.postTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.postDate}>{post.postedAtLabel}</Text>
                <View style={styles.metricsRow}>
                  <ProPostMetric icon="eye-outline" tone="emerald" metric={post.views} />
                  <ProPostMetric icon="bookmark-outline" tone="amber" metric={post.saves} />
                  <ProPostMetric icon="heart-outline" tone="coral" metric={post.likes} />
                  <ProPostMetric icon="chatbubble-outline" tone="blue" metric={post.comments} />
                  <ProPostMetric icon="stats-chart-outline" tone="teal" metric={post.engagementRate} />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <AnalyticsSectionHeader
        title="Content performance tools"
        subtitle="Format, timing, and cadence insights appear when LocalLoop has enough event history."
      />
      <View style={styles.toolsGrid}>
        <ProToolTile label="Best-performing format" icon="layers-outline" tone="emerald" metric={contentData.bestFormat} />
        <ProToolTile label="Best posting times" icon="time-outline" tone="gold" metric={contentData.bestPostingTimes} />
        <ProToolTile label="Posting cadence" icon="calendar-outline" tone="teal" metric={contentData.postingCadence} />
        <ProToolTile
          label="Engagement patterns"
          icon="pulse-outline"
          tone="coral"
          metric={contentData.engagementPatterns}
        />
      </View>

      {!postsFailed && posts.length > 0 ? (
        <Text style={styles.footnote}>
          Likes and comments reflect current engagement on each post. Views, saves, and engagement rate
          are not tracked yet.
        </Text>
      ) : null}
    </View>
  );
}

function ProPostMetric({
  icon,
  tone,
  metric,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'emerald' | 'amber' | 'coral' | 'blue' | 'teal';
  metric: AnalyticsMetricState;
}) {
  const { theme } = useAppTheme();
  const colors = getAnalyticsVisualTone(theme, tone);

  return (
    <View style={postMetricStyles.chip}>
      <View style={[postMetricStyles.chipInner, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={12} color={colors.foreground} />
        <PremiumMetricValue access="unlocked" metric={metric} size="chip" />
      </View>
    </View>
  );
}

const postMetricStyles = StyleSheet.create({
  chip: {
    flexShrink: 1,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: BrandRadius.pill,
  },
});

function ProToolTile({
  label,
  icon,
  tone,
  metric,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'emerald' | 'gold' | 'teal' | 'coral';
  metric: AnalyticsMetricState;
}) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createToolStyles);
  const colors = getAnalyticsVisualTone(theme, tone);

  return (
    <View style={styles.tile}>
      <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={18} color={colors.foreground} />
      </View>
      <PremiumMetricValue access="unlocked" metric={metric} />
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function createToolStyles(theme: AppThemeTokens) {
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

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 16,
    },
    loadingWrap: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    loader: {
      color: theme.emerald,
    },
    postList: {
      gap: 8,
    },
    postRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 10,
    },
    postIndex: {
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
    postCopy: {
      flex: 1,
      gap: 4,
    },
    postTitle: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      lineHeight: 18,
    },
    postDate: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.regular,
    },
    metricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    footnote: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: BrandFonts.regular,
      paddingHorizontal: 4,
    },
  });
}
