import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExplorePostHeader } from '@/components/explore/explore-post-header';
import { PostMedia } from '@/components/explore/post-media';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { ExplorePost } from '@/data/explore-posts';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatEngagementCount } from '@/utils/format-engagement-count';

type ExplorePostCardProps = {
  post: ExplorePost;
  showDistance: boolean;
  isFollowing: boolean;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  commentCount: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onToggleFollow: () => void;
  onPressBusiness: () => void;
  onPressComments: () => void;
  onPressShare: () => void;
};

export function ExplorePostCard({
  post,
  showDistance,
  isFollowing,
  liked,
  saved,
  likeCount,
  commentCount,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onPressBusiness,
  onPressComments,
  onPressShare,
}: ExplorePostCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <ExplorePostHeader
        post={post}
        isFollowing={isFollowing}
        showDistance={showDistance}
        onPressBusiness={onPressBusiness}
        onToggleFollow={onToggleFollow}
      />

      <PostMedia mediaType={post.mediaType} mediaUri={post.mediaUri} />

      <View style={styles.body}>
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            <Pressable
              onPress={onToggleLike}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={liked ? 'Unlike post' : 'Like post'}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={24}
                color={liked ? theme.coral : theme.textSecondary}
              />
              <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
                {formatEngagementCount(likeCount)}
              </Text>
            </Pressable>

            <Pressable
              onPress={onPressComments}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="View comments">
              <Ionicons name="chatbubble-outline" size={23} color={theme.textSecondary} />
              <Text style={styles.actionCount}>{formatEngagementCount(commentCount)}</Text>
            </Pressable>

            <Pressable
              onPress={onPressShare}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Share post">
              <Ionicons name="paper-plane-outline" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            onPress={onToggleSave}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Unsave post' : 'Save post'}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={23}
              color={saved ? theme.emerald : theme.textSecondary}
            />
          </Pressable>
        </View>

        <Text style={styles.caption}>
          <Text style={styles.captionBusiness}>{post.businessName}</Text>
          {'  '}
          {post.caption}
        </Text>

        <Text style={styles.postedAt}>{post.postedAt}</Text>

        <Pressable
          onPress={onPressBusiness}
          style={({ pressed }) => [styles.viewBusinessButton, pressed && styles.viewBusinessButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={`View ${post.businessName} profile`}>
          <Text style={styles.viewBusinessText}>View Business</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.onEmerald} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      marginBottom: 8,
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
      gap: 8,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    actionButtonPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.96 }],
    },
    actionCount: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      minWidth: 18,
    },
    actionCountActive: {
      color: theme.coral,
    },
    caption: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    captionBusiness: {
      fontFamily: BrandFonts.bold,
    },
    postedAt: {
      color: theme.textMuted,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    viewBusinessButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 4,
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingVertical: 13,
      ...theme.shadowButton,
    },
    viewBusinessButtonPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    viewBusinessText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
