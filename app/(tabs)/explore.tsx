import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
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
import {
  EXPLORE_POSTS,
  type ExplorePost,
  type ExploreSegment,
  filterExplorePosts,
  getInitiallyFollowedBusinessIds,
} from '@/data/explore-posts';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useSavedItems } from '@/contexts/saved-items-context';
import { openBusinessProfile } from '@/utils/open-business-profile';
import { resetOnboarding } from '@/utils/onboarding-storage';

export default function ExploreScreen() {
  const styles = useThemedStyles(createStyles);
  const [segment, setSegment] = useState<ExploreSegment>('nearby');
  const [followedBusinessIds, setFollowedBusinessIds] = useState<Set<string>>(
    () => getInitiallyFollowedBusinessIds(),
  );
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const { isPostSaved, togglePostSaved } = useSavedItems();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(EXPLORE_POSTS.map((post) => [post.id, post.likeCount])),
  );

  const posts = useMemo(
    () => filterExplorePosts(segment, followedBusinessIds),
    [segment, followedBusinessIds],
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

  const handleViewBusiness = useCallback((businessId: string) => {
    openBusinessProfile(businessId);
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
        showDistance={segment === 'nearby'}
        isFollowing={followedBusinessIds.has(item.businessId)}
        liked={likedIds.has(item.id)}
        saved={isPostSaved(item.id)}
        likeCount={likeCounts[item.id] ?? item.likeCount}
        onToggleLike={() => toggleLike(item)}
        onToggleSave={() => togglePostSaved(item)}
        onToggleFollow={() => toggleFollow(item.businessId)}
        onPressBusiness={() => handleViewBusiness(item.businessId)}
        onPressComments={handleComments}
        onPressShare={() => handleShare(item)}
      />
    ),
    [
      segment,
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
      <LocalLoopWordmark style={styles.headerWordmark} />
      <Text style={styles.title}>Explore</Text>
      <ExploreFilterToggle selectedSegment={segment} onSelect={setSegment} />
    </View>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No posts from followed businesses</Text>
      <Text style={styles.emptyText}>
        Follow local businesses in Nearby to build your personalized feed.
      </Text>
    </View>
  );

  const listFooter =
    __DEV__ ? (
      <Pressable
        onPress={async () => {
          await resetOnboarding();
          router.replace('/onboarding/splash');
        }}
        style={styles.devButton}>
        <Text style={styles.devButtonText}>Replay Onboarding</Text>
      </Pressable>
    ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={segment === 'following' ? listEmpty : null}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
    title: {
      color: theme.text,
      fontSize: 34,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.8,
      marginTop: -6,
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
