import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExplorePostCommentsSheet } from '@/components/explore/explore-post-comments-sheet';
import { ExplorePostHeader } from '@/components/explore/explore-post-header';
import { PostMedia } from '@/components/explore/post-media';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useFollowedBusinesses } from '@/contexts/followed-businesses-context';
import { useSavedItems } from '@/contexts/saved-items-context';
import { usePostEngagement } from '@/hooks/use-post-engagement';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getPublishedPostById } from '@/services/explorePosts';
import type { ConsumerPublishedPost } from '@/types/consumer-published-post';
import { formatEngagementCount } from '@/utils/format-engagement-count';
import { openBusinessProfile } from '@/utils/open-business-profile';
import { parseAnnouncementCaption } from '@/utils/announcement-form';

export default function ConsumerPostDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const postId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');

  const { userId, businessRecord } = useAccountMode();
  const { isFollowing, toggleFollow } = useFollowedBusinesses();
  const { isPostSaved, togglePostSaved } = useSavedItems();

  const [post, setPost] = useState<ConsumerPublishedPost | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'not_found'>('loading');
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const engagementPostIds = useMemo(
    () => (post ? [post.id] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable on post id only
    [post?.id],
  );
  const engagement = usePostEngagement(engagementPostIds);

  const loadPost = useCallback(async () => {
    const trimmedId = postId.trim();
    if (!trimmedId) {
      setLoadState('not_found');
      return;
    }

    setLoadState('loading');
    const result = await getPublishedPostById(trimmedId);

    if (!result.ok) {
      setPost(null);
      setLoadMessage(result.message);
      setLoadState(result.code === 'not_found' ? 'not_found' : 'error');
      return;
    }

    setPost(result.post);
    setLoadState('ready');
  }, [postId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async post fetch kickoff
    void loadPost();
  }, [loadPost]);

  const isBusinessOwner = Boolean(
    post && businessRecord?.id && post.businessId === businessRecord.id,
  );

  const likeCount = post ? engagement.getCounts(post.id).likeCount : 0;
  const commentCount = post ? engagement.getCounts(post.id).commentCount : 0;
  const liked = post ? engagement.isLiked(post.id) : false;
  const saved = post ? isPostSaved(post.id) : false;

  const activePostId = post?.id;

  const handleCommentCountChange = useCallback(
    (_targetPostId: string, count: number) => {
      if (activePostId) {
        engagement.setCommentCount(activePostId, count);
      }
    },
    [activePostId, engagement.setCommentCount],
  );

  const explorePostForSave = useMemo(() => {
    if (!post) {
      return null;
    }
    return {
      ...post,
      likeCount,
      commentCount,
    };
  }, [post, likeCount, commentCount]);

  const handleToggleLike = useCallback(async () => {
    if (!post) {
      return;
    }
    if (isBusinessOwner) {
      Alert.alert('Unavailable', 'Business owners cannot like their own posts.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await engagement.toggleLike(post.id);
    if (!result.ok) {
      Alert.alert('Unable to update like', result.message);
    }
  }, [post, isBusinessOwner, engagement]);

  const handleOpenComments = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCommentsOpen(true);
  }, []);

  const handleShare = useCallback(async () => {
    if (!post) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${post.businessName}: ${post.caption}`,
      });
    } catch {
      Alert.alert('Unable to share', 'Sharing is not available on this device right now.');
    }
  }, [post]);

  const handleToggleSave = useCallback(() => {
    if (!explorePostForSave) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePostSaved(explorePostForSave);
  }, [explorePostForSave, togglePostSaved]);

  if (loadState === 'loading') {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={theme.emerald} />
        <Text style={styles.loadingText}>Loading post…</Text>
      </SafeAreaView>
    );
  }

  if (loadState === 'not_found' || loadState === 'error' || !post) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <Text style={styles.errorTitle}>
          {loadState === 'not_found' ? 'Post not found' : 'Unable to load post'}
        </Text>
        {loadMessage ? <Text style={styles.errorSubtitle}>{loadMessage}</Text> : null}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const announcement =
    post.postType === 'announcement' ? parseAnnouncementCaption(post.caption) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backIconButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Post
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ExplorePostHeader
          post={post}
          isFollowing={isFollowing(post.businessId)}
          showDistance={false}
          onPressBusiness={() => openBusinessProfile(post.businessId, { source: 'post-detail' })}
          onToggleFollow={() => {
            void toggleFollow(post.businessId);
          }}
        />

        {post.postType === 'photo' && post.mediaUri ? (
          <PostMedia mediaType={post.mediaType} mediaUri={post.mediaUri} />
        ) : null}

        {announcement ? (
          <View style={styles.announcementBlock}>
            <View style={styles.announcementBadge}>
              <Text style={styles.announcementBadgeText}>Announcement</Text>
            </View>
            {announcement.title ? (
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
            ) : null}
            <Text style={styles.announcementMessage}>
              {announcement.message || post.caption}
            </Text>
          </View>
        ) : null}

        <View style={styles.body}>
          <View style={styles.actionsRow}>
            <View style={styles.actionsLeft}>
              <Pressable
                onPress={() => {
                  void handleToggleLike();
                }}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={liked ? 'Unlike post' : 'Like post'}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={liked ? theme.coral : theme.textSecondary}
                />
                <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
                  {!engagement.hasLoaded && engagement.loading
                    ? '…'
                    : formatEngagementCount(likeCount)}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleOpenComments}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="View comments">
                <Ionicons name="chatbubble-outline" size={23} color={theme.textSecondary} />
                <Text style={styles.actionCount}>
                  {!engagement.hasLoaded && engagement.loading
                    ? '…'
                    : formatEngagementCount(commentCount)}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleShare();
                }}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Share post">
                <Ionicons name="paper-plane-outline" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleToggleSave}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
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

          {post.postType === 'photo' ? (
            <Text style={styles.caption}>
              <Text style={styles.captionBusiness}>{post.businessName}</Text>
              {'  '}
              {post.caption}
            </Text>
          ) : null}

          <Text style={styles.postedAt}>{post.postedAt}</Text>

          <Pressable
            onPress={() => openBusinessProfile(post.businessId, { source: 'post-detail' })}
            style={({ pressed }) => [styles.viewBusinessButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`View ${post.businessName} profile`}>
            <Text style={styles.viewBusinessText}>View Business</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.onEmerald} />
          </Pressable>
        </View>
      </ScrollView>

      {commentsOpen ? (
        <ExplorePostCommentsSheet
          key={post.id}
          postId={post.id}
          currentUserId={userId}
          isBusinessOwnerOfPost={isBusinessOwner}
          onClose={() => setCommentsOpen(false)}
          onCommentCountChange={handleCommentCountChange}
        />
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    centered: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 32,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.medium,
    },
    errorTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    errorSubtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    backButton: {
      marginTop: 8,
      backgroundColor: theme.emerald,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
    },
    backButtonText: {
      color: theme.onEmerald,
      fontFamily: BrandFonts.semiBold,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    backIconButton: {
      padding: 4,
    },
    topBarTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    topBarSpacer: {
      width: 34,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    announcementBlock: {
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 8,
    },
    announcementBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    announcementBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    announcementTitle: {
      color: theme.text,
      fontSize: 20,
      lineHeight: 26,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    announcementMessage: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 12,
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
    pressed: {
      opacity: 0.72,
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
    viewBusinessText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
