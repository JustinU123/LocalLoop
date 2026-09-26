import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AnalyticsEmptyState } from '@/components/business/analytics/analytics-empty-state';
import { AnalyticsFeatureShell } from '@/components/business/analytics/analytics-feature-shell';
import { ContentInsightsPanel } from '@/components/business/analytics/premium/content-insights-panel';
import { ProContentPanel } from '@/components/business/analytics/pro/pro-content-panel';
import { PremiumContentPanel } from '@/components/business/analytics/premium/premium-content-panel';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { usesPremiumAnalyticsPanels, usesProAnalyticsPanels } from '@/utils/analytics-panel-routing';
import { buildContentInsightsViewModel } from '@/utils/analytics-premium-view-model';
import { AnalyticsPostRow } from '@/components/business/analytics/analytics-post-row';
import { AnalyticsSectionHeader } from '@/components/business/analytics/analytics-section-header';
import { BusinessSectionCard } from '@/components/business/business-section-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';

type AnalyticsContentPanelProps = {
  loading: boolean;
  postsFailed: boolean;
  posts: BusinessPost[];
  engagement: BusinessPostEngagementSummary | null;
  engagementFailed: boolean;
};

export function AnalyticsContentPanel({
  loading,
  postsFailed,
  posts,
  engagement,
  engagementFailed,
}: AnalyticsContentPanelProps) {
  const styles = useThemedStyles(createStyles);
  const { getFeatureAccess, hasCapability } = useAnalyticsAccess();
  const contentAccess = getFeatureAccess('analytics.content_insights');
  const engagementAccess = getFeatureAccess('analytics.engagement_likes');
  const contentData = buildContentInsightsViewModel(postsFailed ? [] : posts, loading, {
    summary: engagement,
    failed: engagementFailed,
  });

  if (usesPremiumAnalyticsPanels(hasCapability)) {
    return (
      <PremiumContentPanel
        loading={loading}
        posts={posts}
        postsFailed={postsFailed}
        engagement={engagement}
        engagementFailed={engagementFailed}
      />
    );
  }

  if (usesProAnalyticsPanels(hasCapability)) {
    return (
      <ProContentPanel
        loading={loading}
        posts={posts}
        postsFailed={postsFailed}
        engagement={engagement}
        engagementFailed={engagementFailed}
      />
    );
  }

  return (
    <View style={styles.root}>
      <AnalyticsSectionHeader
        title="Your content"
        subtitle="Recent posts from your business profile."
      />

      <BusinessSectionCard title="Recent posts">
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
        ) : posts.length === 0 ? (
          <AnalyticsEmptyState
            icon="images-outline"
            title="No posts yet"
            message="Publish a photo or announcement to see it listed here."
          />
        ) : (
          <View style={styles.list}>
            {posts.map((post, index) => (
              <View key={post.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <AnalyticsPostRow
                  post={post}
                  likeCount={engagement?.byPostId[post.id]?.likeCount ?? 0}
                  commentCount={engagement?.byPostId[post.id]?.commentCount ?? 0}
                  engagementLoading={loading}
                  engagementFailed={engagementFailed}
                />
              </View>
            ))}
          </View>
        )}
      </BusinessSectionCard>

      {!postsFailed && posts.length > 0 ? (
        <Text style={styles.footnote}>
          Likes and comments reflect current engagement on your posts. Per-post views and saves are
          not tracked in Basic yet.
        </Text>
      ) : null}

      <AnalyticsFeatureShell
        access={contentAccess}
        title="Content Insights"
        description="Learn what content performs best, spot stronger posting opportunities, and see patterns in local engagement."
        upgradeSource="analytics-content-insights"
        lockedViewportHeight={300}>
        <ContentInsightsPanel
          access={contentAccess}
          engagementAccess={engagementAccess}
          data={contentData}
        />
      </AnalyticsFeatureShell>
    </View>
  );
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
    list: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginHorizontal: 4,
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
