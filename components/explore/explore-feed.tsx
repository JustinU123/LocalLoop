import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { ExploreFilterToggle } from '@/components/explore/explore-filter-toggle';
import { ExplorePostCard } from '@/components/explore/explore-post-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import type { ExplorePost, ExploreSegment } from '@/data/explore-posts';
import { useSavedItems } from '@/contexts/saved-items-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  filterExplorePostsForSegment,
  getPublishedExplorePosts,
} from '@/services/explorePosts';
import { openBusinessProfile } from '@/utils/open-business-profile';
import { resetOnboarding } from '@/utils/onboarding-storage';

type ExploreFeedProps = {
  title?: string;
  eyebrow?: string;
  showWordmark?: boolean;
  showDevReplayButton?: boolean;
};

export function ExploreFeed({
  title = 'Explore',
  eyebrow,
  showWordmark = true,
  showDevReplayButton = true,
}: ExploreFeedProps) {
  const styles = useThemedStyles(createStyles);
  const [segment, setSegment] = useState<ExploreSegment>('nearby');
  const [allPosts, setAllPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [followedBusinessIds, setFollowedBusinessIds] = useState<Set<string>>(() => new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const { isPostSaved, togglePostSaved } = useSavedItems();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const hasLoadedOnceRef = useRef(false);

  const loadPosts = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    }
    if (mode === 'refresh') {
      setRefreshing(true);
    }

    const result = await getPublishedExplorePosts();

    if (mode === 'initial') {
      setLoading(false);
    }
    if (mode === 'refresh') {
      setRefreshing(false);
    }

    if (!result.ok) {
      setErrorMessage(result.message);
      if (__DEV__) {
        console.error('[explore-feed:loadPosts]', result.message);
      }
      return;
    }

    setErrorMessage(null);
    setAllPosts(result.posts);
    setLikeCounts((current) => {
      const next = { ...current };
      for (const post of result.posts) {
        if (next[post.id] === undefined) {
          next[post.id] = post.likeCount;
        }
      }
      return next;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const mode = hasLoadedOnceRef.current ? 'silent' : 'initial';
      void loadPosts(mode).finally(() => {
        hasLoadedOnceRef.current = true;
      });
    }, [loadPosts]),
  );

  const posts = useMemo(
    () => filterExplorePostsForSegment(allPosts, segment, followedBusinessIds),
    [allPosts, segment, followedBusinessIds],
  );

  const toggleLike = useCallback((post: ExplorePost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedIds((prev) => {
      const next = new Set(prev);
      const liked = next.has(post.id);

      if (liked) {
        next.delete(post.id);
        setLikeCounts((counts) => ({
          ...counts,
          [post.id]: Math.max(0, (counts[post.id] ?? post.likeCount) - 1),
        }));
      } else {
        next.add(post.id);
        setLikeCounts((counts) => ({
          ...counts,
          [post.id]: (counts[post.id] ?? post.likeCount) + 1,
        }));
      }

      return next;
    });
  }, []);

  const toggleFollow = useCallback((businessId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFollowedBusinessIds((prev) => {
      const next = new Set(prev);
      if (next.has(businessId)) {
        next.delete(businessId);
      } else {
        next.add(businessId);
      }
      return next;
    });
  }, []);

  const handleViewBusiness = useCallback((businessId: string, postId?: string) => {
    openBusinessProfile(businessId, { postId, source: 'explore' });
  }, []);

  const handleComments = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Comments coming soon', 'Comment threads will arrive in a future update.');
  }, []);

  const handleShare = useCallback(async (post: ExplorePost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${post.businessName}: ${post.caption}`,
      });
    } catch {
      Alert.alert('Unable to share', 'Sharing is not available on this device right now.');
    }
  }, []);

  const renderPost: ListRenderItem<ExplorePost> = useCallback(
    ({ item }) => (
      <ExplorePostCard
        post={item}
        showDistance={false}
        isFollowing={followedBusinessIds.has(item.businessId)}
        liked={likedIds.has(item.id)}
        saved={isPostSaved(item.id)}
        likeCount={likeCounts[item.id] ?? item.likeCount}
        onToggleLike={() => toggleLike(item)}
        onToggleSave={() => togglePostSaved(item)}
        onToggleFollow={() => toggleFollow(item.businessId)}
        onPressBusiness={() => handleViewBusiness(item.businessId, item.id)}
        onPressComments={handleComments}
        onPressShare={() => handleShare(item)}
      />
    ),
    [
      followedBusinessIds,
      likedIds,
      likeCounts,
      toggleLike,
      togglePostSaved,
      isPostSaved,
      toggleFollow,
      handleViewBusiness,
      handleComments,
      handleShare,
    ],
  );

  const listHeader = (
    <View style={styles.listHeader}>
      {showWordmark ? <LocalLoopWordmark style={styles.headerWordmark} /> : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <ExploreFilterToggle selectedSegment={segment} onSelect={setSegment} />
    </View>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      {segment === 'following' ? (
        <>
          <Text style={styles.emptyTitle}>Follow local businesses to see their posts here.</Text>
          <Text style={styles.emptyText}>
            Following is not connected to your account yet. Browse Nearby to discover verified
            businesses for now.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyTitle}>No local posts yet.</Text>
          <Text style={styles.emptyText}>
            Be the first to discover what nearby businesses are sharing.
          </Text>
        </>
      )}
    </View>
  );

  const listFooter =
    __DEV__ && showDevReplayButton ? (
      <Pressable
        onPress={async () => {
          await resetOnboarding();
          router.replace('/onboarding/splash');
        }}
        style={styles.devButton}>
        <Text style={styles.devButtonText}>Replay Onboarding</Text>
      </Pressable>
    ) : null;

  if (loading && allPosts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.listHeader}>
          {showWordmark ? <LocalLoopWordmark style={styles.headerWordmark} /> : null}
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          <ExploreFilterToggle selectedSegment={segment} onSelect={setSegment} />
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator color={styles.loadingIndicator.color} size="large" />
          <Text style={styles.loadingText}>Loading local posts…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage && allPosts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.listHeader}>
          {showWordmark ? <LocalLoopWordmark style={styles.headerWordmark} /> : null}
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          <ExploreFilterToggle selectedSegment={segment} onSelect={setSegment} />
        </View>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Unable to load posts</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            onPress={() => {
              void loadPosts('initial');
            }}
            style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadPosts('refresh');
            }}
            tintColor={styles.loadingIndicator.color}
          />
        }
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    listContent: {
      paddingBottom: 120,
      flexGrow: 1,
    },
    listHeader: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 16,
      gap: 16,
    },
    headerWordmark: {
      marginBottom: 0,
    },
    eyebrow: {
      color: theme.coral,
      fontSize: 12,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.text,
      fontSize: 34,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.8,
      marginTop: -6,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 32,
    },
    loadingIndicator: {
      color: theme.emerald,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.medium,
      textAlign: 'center',
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 32,
    },
    errorTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    errorText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 4,
      backgroundColor: theme.emerald,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    retryButtonText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    devButton: {
      marginTop: 8,
      marginHorizontal: 20,
      marginBottom: 24,
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    devButtonText: {
      color: theme.emerald,
      fontFamily: BrandFonts.semiBold,
      fontSize: 14,
    },
  });
}
