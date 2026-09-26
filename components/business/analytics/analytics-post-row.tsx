import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessPost } from '@/types/supabase-post';
import { analyticsPostMetricTextStyle } from '@/utils/analytics-post-metric-typography';
import { getAnalyticsVisualTone } from '@/utils/analytics-visual-tones';

type AnalyticsPostRowProps = {
  post: BusinessPost;
  likeCount?: number | null;
  commentCount?: number | null;
  engagementLoading?: boolean;
  engagementFailed?: boolean;
};

function formatPostedDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function postTypeLabel(post: BusinessPost): string {
  if (post.postType === 'announcement') {
    return 'Announcement';
  }
  return 'Photo post';
}

function captionPreview(post: BusinessPost): string {
  const caption = post.caption?.trim();
  if (caption) {
    return caption.length > 80 ? `${caption.slice(0, 77)}…` : caption;
  }
  return postTypeLabel(post);
}

function formatCountValue(
  value: number | null | undefined,
  loading: boolean,
  failed: boolean,
): string {
  if (failed) {
    return '—';
  }
  if (loading) {
    return '…';
  }
  if (value === null || value === undefined) {
    return '—';
  }
  return String(value);
}

export function AnalyticsPostRow({
  post,
  likeCount,
  commentCount,
  engagementLoading = false,
  engagementFailed = false,
}: AnalyticsPostRowProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const imageUri = post.imageUrl?.trim();
  const viewTone = getAnalyticsVisualTone(theme, 'emerald');
  const saveTone = getAnalyticsVisualTone(theme, 'amber');
  const likeTone = getAnalyticsVisualTone(theme, 'coral');
  const commentTone = getAnalyticsVisualTone(theme, 'blue');

  return (
    <View style={styles.row}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Ionicons name="document-text-outline" size={22} color={styles.placeholderIcon.color} />
        </View>
      )}
      <View style={styles.copy}>
        <Text style={styles.type}>{postTypeLabel(post)}</Text>
        <Text style={styles.caption} numberOfLines={2}>
          {captionPreview(post)}
        </Text>
        <Text style={styles.date}>{formatPostedDate(post.createdAt)}</Text>
        <View style={styles.metricsRow}>
          <View style={[styles.metricChip, { backgroundColor: viewTone.background }]}>
            <Ionicons name="eye-outline" size={14} color={viewTone.foreground} />
            <Text style={styles.metricText}>—</Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: saveTone.background }]}>
            <Ionicons name="bookmark-outline" size={14} color={saveTone.foreground} />
            <Text style={styles.metricText}>—</Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: likeTone.background }]}>
            <Ionicons name="heart-outline" size={14} color={likeTone.foreground} />
            <Text style={styles.metricText}>
              {formatCountValue(likeCount, engagementLoading, engagementFailed)}
            </Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: commentTone.background }]}>
            <Ionicons name="chatbubble-outline" size={14} color={commentTone.foreground} />
            <Text style={styles.metricText}>
              {formatCountValue(commentCount, engagementLoading, engagementFailed)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    thumb: {
      width: 76,
      height: 76,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    thumbPlaceholder: {
      width: 76,
      height: 76,
      borderRadius: BrandRadius.md,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderIcon: {
      color: theme.textMuted,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    type: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    caption: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
      lineHeight: 20,
    },
    date: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    metricChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: BrandRadius.pill,
    },
    metricText: analyticsPostMetricTextStyle(theme),
  });
}
