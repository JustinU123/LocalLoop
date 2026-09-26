import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PublicProfileAnnouncementPostPreview,
  PublicProfilePhotoPostPreview,
} from '@/components/business/public-profile-post-preview';
import { EventPreviewCard } from '@/components/business/event-preview-card';
import { ActivePromotionProfileCard } from '@/components/promotions/active-promotion-profile-card';
import { MenuSectionsList } from '@/components/business/menu-sections-list';
import {
  PublicProfileHeader,
  type PublicProfilePrimaryCta,
} from '@/components/business/public-profile-header';
import { PublicProfileReviewsPanel } from '@/components/business/public-profile-reviews-panel';
import { PublicProfileReviewsPlaceholder } from '@/components/business/public-profile-reviews-placeholder';
import { PublicProfileTabEmpty } from '@/components/business/public-profile-tab-empty';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useFollowedBusinesses } from '@/contexts/followed-businesses-context';
import { useSavedItems } from '@/contexts/saved-items-context';
import { usePostEngagement } from '@/hooks/use-post-engagement';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getBusinessFollowerCount } from '@/services/businessFollows';
import {
  deleteBusinessReview,
  getBusinessReviewsBundle,
} from '@/services/businessReviews';
import { getPublicBusinessProfile } from '@/services/publicBusinessProfile';
import {
  getActivePromotionsForBusiness,
  getOwnerScheduledPromotionsForBusiness,
  mergeOwnerProfilePromotions,
} from '@/services/promotions';
import { formatScheduledPromotionLiveLabel } from '@/utils/promotion-scheduled-live-label';
import type { BusinessReviewSummary, PublicBusinessReview } from '@/types/supabase-review';
import { getCurrentSession } from '@/utils/auth';
import { buildReviewSummaryFromRatings, createEmptyReviewSummary } from '@/utils/review-stats';
import { PUBLIC_PROFILE_TABS, type PublicProfileTab } from '@/types/public-profile-tab';
import {
  Business,
  BusinessPromotionItem,
  BusinessReview,
  getBusinessById,
} from '@/data/businesses';
import type { EventDraft } from '@/types/event-draft';

type TabRow =
  | { key: string; kind: 'post'; postId: string; image: string; caption: string; postedAt: string }
  | {
      key: string;
      kind: 'announcement';
      postId: string;
      caption: string;
      postedAt: string;
    }
  | { key: string; kind: 'event'; eventId: string; draft: EventDraft }
  | { key: string; kind: 'review'; review: BusinessReview }
  | { key: string; kind: 'menu' }
  | { key: string; kind: 'menu-empty' }
  | { key: string; kind: 'reviews-empty' }
  | { key: string; kind: 'reviews-panel' }
  | { key: string; kind: 'posts-empty' }
  | { key: string; kind: 'events-empty' }
  | { key: string; kind: 'promotion'; promotion: BusinessPromotionItem }
  | { key: string; kind: 'promotions-empty' }
  | { key: string; kind: 'about' };

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const wholeStars = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < wholeStars ? 'star' : 'star-outline'}
          size={size}
          color={theme.star}
        />
      ))}
    </View>
  );
}

type ProfileSource = 'mock' | 'supabase';

function buildTabRows(tab: PublicProfileTab, business: Business, profileSource: ProfileSource): TabRow[] {
  switch (tab) {
    case 'posts': {
      if (business.posts.length === 0) {
        return [{ key: 'posts-empty', kind: 'posts-empty' }];
      }
      return business.posts.map((post) => {
        if (post.postType === 'announcement') {
          return {
            key: post.id,
            kind: 'announcement' as const,
            postId: post.id,
            caption: post.caption,
            postedAt: post.postedAt,
          };
        }

        return {
          key: post.id,
          kind: 'post' as const,
          postId: post.id,
          image: post.image ?? '',
          caption: post.caption,
          postedAt: post.postedAt,
        };
      });
    }
    case 'menu':
      if (business.menu.length === 0) {
        return [{ key: 'menu-empty', kind: 'menu-empty' }];
      }
      return [{ key: 'menu', kind: 'menu' }];
    case 'events':
      if (business.events.length === 0) {
        return [{ key: 'events-empty', kind: 'events-empty' }];
      }
      return business.events.map((event) => ({
        key: event.id,
        kind: 'event' as const,
        eventId: event.id,
        draft: event.draft,
      }));
    case 'promotions':
      if (business.promotions.length === 0) {
        return [{ key: 'promotions-empty', kind: 'promotions-empty' }];
      }
      return business.promotions.map((promotion) => ({
        key: promotion.id,
        kind: 'promotion' as const,
        promotion,
      }));
    case 'reviews':
      if (profileSource === 'supabase') {
        return [{ key: 'reviews-panel', kind: 'reviews-panel' }];
      }
      if (business.reviews.length === 0) {
        return [{ key: 'reviews-empty', kind: 'reviews-empty' }];
      }
      return business.reviews.map((review) => ({
        key: review.id,
        kind: 'review' as const,
        review,
      }));
    case 'about':
      return [{ key: 'about', kind: 'about' }];
    default:
      return [];
  }
}

export default function BusinessProfileScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const { id, tab: tabParam } = useLocalSearchParams<{ id: string | string[]; tab?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const businessId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');
  const routeTab = Array.isArray(tabParam) ? tabParam[0] : tabParam;
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PublicProfileTab>(() => {
    if (routeTab && PUBLIC_PROFILE_TABS.some((entry) => entry.id === routeTab)) {
      return routeTab as PublicProfileTab;
    }
    return 'posts';
  });
  const [profileSource, setProfileSource] = useState<ProfileSource | null>(null);
  const [reviewSummary, setReviewSummary] = useState<BusinessReviewSummary>(createEmptyReviewSummary());
  const [supabaseReviews, setSupabaseReviews] = useState<PublicBusinessReview[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null | undefined>(undefined);
  const [followerCount, setFollowerCount] = useState(0);
  const [promotionTick, setPromotionTick] = useState(() => Date.now());
  const { isFollowing, toggleFollow } = useFollowedBusinesses();
  const { isBusinessSaved, toggleBusinessSaved } = useSavedItems();
  const { businessRecord } = useAccountMode();
  const saved = business ? isBusinessSaved(business.id) : false;

  const refreshFollowerCount = useCallback(async (targetBusinessId: string) => {
    const result = await getBusinessFollowerCount(targetBusinessId);
    if (result.ok) {
      setFollowerCount(result.count);
    } else if (__DEV__) {
      console.error('[business-profile] follower count load failed', result.message);
    }
  }, []);

  const refreshProfilePromotions = useCallback(
    async (targetBusinessId: string, now = new Date()) => {
      const result = await getActivePromotionsForBusiness(targetBusinessId, now);
      if (!result.ok) {
        if (__DEV__) {
          console.error('[business-profile] promotions refresh failed', result.message);
        }
        return;
      }

      let promotions = result.promotions;
      const viewerOwnsBusiness =
        profileSource === 'supabase' && businessRecord?.id === targetBusinessId;

      if (viewerOwnsBusiness) {
        const scheduledResult = await getOwnerScheduledPromotionsForBusiness(targetBusinessId, now);
        if (scheduledResult.ok) {
          promotions = mergeOwnerProfilePromotions(result.promotions, scheduledResult.promotions);
        } else if (__DEV__) {
          console.error(
            '[business-profile] scheduled promotions refresh failed',
            scheduledResult.message,
          );
        }
      }

      setBusiness((current) =>
        current && current.id === targetBusinessId ? { ...current, promotions } : current,
      );
    },
    [businessRecord?.id, profileSource],
  );

  const refreshSupabaseReviews = useCallback(async (targetBusinessId: string) => {
    const session = await getCurrentSession();
    setCurrentUserId(session?.user?.id ?? null);

    const result = await getBusinessReviewsBundle(targetBusinessId);
    if (!result.ok) {
      if (__DEV__) {
        console.error('[business-profile] reviews load failed', result.message);
      }
      return;
    }

    setReviewSummary(result.summary);
    setSupabaseReviews(result.reviews);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBusiness() {
      setLoading(true);
      setLoadError(null);
      setCurrentUserId(undefined);

      const mockBusiness = getBusinessById(businessId);
      if (mockBusiness) {
        if (!cancelled) {
          setBusiness(mockBusiness);
          setProfileSource('mock');
          setReviewSummary(
            buildReviewSummaryFromRatings(mockBusiness.reviews.map((review) => review.rating)),
          );
          setSupabaseReviews([]);
          setLoading(false);
        }
        return;
      }

      const result = await getPublicBusinessProfile(businessId);
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setBusiness(result.business);
        setProfileSource('supabase');
        setLoadError(null);
        await Promise.all([
          refreshSupabaseReviews(result.business.id),
          refreshFollowerCount(result.business.id),
        ]);
      } else {
        setBusiness(null);
        setLoadError(result.message);
        if (__DEV__) {
          console.error('[business-profile] supabase load failed', {
            businessId,
            code: result.code,
            message: result.message,
          });
        }
      }

      setLoading(false);
    }

    void loadBusiness();

    return () => {
      cancelled = true;
    };
  }, [businessId, refreshSupabaseReviews, refreshFollowerCount]);

  const postCount = business?.posts.length ?? 0;

  const profilePostsIdsKey =
    profileSource === 'supabase' && business
      ? business.posts.map((post) => post.id).join(',')
      : '';

  const profilePostIds = useMemo(
    () =>
      profileSource === 'supabase' && business ? business.posts.map((post) => post.id) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by post id list, not business object identity
    [profileSource, profilePostsIdsKey],
  );

  const profilePostEngagement = usePostEngagement(profilePostIds);
  const refreshProfilePostEngagement = profilePostEngagement.refresh;

  const businessIdForFocus = business?.id;

  useFocusEffect(
    useCallback(() => {
      if (profileSource === 'supabase' && businessIdForFocus) {
        void refreshSupabaseReviews(businessIdForFocus);
        void refreshFollowerCount(businessIdForFocus);
        void refreshProfilePromotions(businessIdForFocus);
        if (activeTab === 'posts') {
          void refreshProfilePostEngagement({ background: true });
        }
      }
    }, [
      profileSource,
      businessIdForFocus,
      activeTab,
      refreshSupabaseReviews,
      refreshFollowerCount,
      refreshProfilePromotions,
      refreshProfilePostEngagement,
    ]),
  );

  const displayBusiness = useMemo(() => {
    if (!business) {
      return null;
    }

    if (profileSource === 'mock') {
      return business;
    }

    return {
      ...business,
      rating: reviewSummary.averageRating,
      reviewCount: reviewSummary.reviewCount,
      followerCount,
    };
  }, [business, profileSource, reviewSummary, followerCount]);

  const isBusinessOwner = Boolean(business && businessRecord?.id === business.id);

  const hasOwnerScheduledPromotions = useMemo(
    () => Boolean(business?.promotions.some((promotion) => promotion.ownerPreviewScheduled)),
    [business?.promotions],
  );

  useEffect(() => {
    if (activeTab !== 'promotions' || !isBusinessOwner || !business?.id) {
      return;
    }

    if (!hasOwnerScheduledPromotions) {
      return;
    }

    const intervalId = setInterval(() => {
      const nowMs = Date.now();
      setPromotionTick(nowMs);
      void refreshProfilePromotions(business.id, new Date(nowMs));
    }, 60_000);

    return () => clearInterval(intervalId);
  }, [
    activeTab,
    business?.id,
    hasOwnerScheduledPromotions,
    isBusinessOwner,
    refreshProfilePromotions,
  ]);

  const handleOwnerEditPromotion = useCallback((promotionId: string) => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/business-edit-promotion',
      params: { id: promotionId },
    });
  }, []);

  const primaryCta = useMemo((): PublicProfilePrimaryCta => {
    if (!business || !profileSource) {
      return 'loading';
    }
    if (profileSource === 'mock') {
      return 'follow';
    }
    if (currentUserId === undefined) {
      return 'loading';
    }
    if (business.ownerUserId && currentUserId === business.ownerUserId) {
      return 'edit-profile';
    }
    return 'follow';
  }, [business, profileSource, currentUserId]);

  const tabRows = useMemo(
    () =>
      business && profileSource
        ? buildTabRows(activeTab, business, profileSource)
        : [],
    [activeTab, business, profileSource],
  );

  const handleShare = async () => {
    if (!business) return;
    await Share.share({
      message: `Check out ${business.name} on LocalLoop — ${business.website}`,
    });
  };

  const handleTabChange = (tab: PublicProfileTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleOpenPostDetail = useCallback((targetPostId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/post/[id]',
      params: { id: targetPostId },
    });
  }, []);

  const handleOpenReviews = () => {
    Haptics.selectionAsync();
    setActiveTab('reviews');
  };

  const handleOpenReviewEditor = useCallback(async () => {
    if (!business) {
      return;
    }

    const session = await getCurrentSession();
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in to leave a review.');
      return;
    }

    router.push(`/business/review/${business.id}`);
  }, [business]);

  const handleDeleteReview = useCallback(
    (reviewId: string) => {
      Alert.alert('Delete review?', 'This will remove your review from the business profile.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const result = await deleteBusinessReview(reviewId);
              if (!result.ok) {
                Alert.alert('Unable to delete', result.message);
                return;
              }
              if (business) {
                await refreshSupabaseReviews(business.id);
              }
            })();
          },
        },
      ]);
    },
    [business, refreshSupabaseReviews],
  );

  const renderTabRow: ListRenderItem<TabRow> = ({ item, index }) => {
    if (!business) return null;

    if (item.kind === 'posts-empty') {
      return (
        <PublicProfileTabEmpty
          title="No posts yet"
          message="This business has not published any posts or announcements."
        />
      );
    }

    if (item.kind === 'menu-empty') {
      return (
        <PublicProfileTabEmpty
          title="No menu items yet"
          message="Published menu items will appear here when available."
        />
      );
    }

    if (item.kind === 'events-empty') {
      return (
        <PublicProfileTabEmpty
          title="No events yet"
          message="Upcoming events from this business will show here."
        />
      );
    }

    if (item.kind === 'promotions-empty') {
      return (
        <PublicProfileTabEmpty
          title="No active promotions"
          message="This business does not have any live promotions right now."
        />
      );
    }

    if (item.kind === 'promotion') {
      const promotionNow = new Date(promotionTick);
      const scheduledLiveLabel = item.promotion.ownerPreviewScheduled
        ? formatScheduledPromotionLiveLabel(item.promotion.startAt, promotionNow)
        : null;
      const showOwnerScheduledPreview = Boolean(scheduledLiveLabel?.trim());

      return (
        <Animated.View entering={FadeInDown.duration(320)} style={styles.promotionTabWrap}>
          <ActivePromotionProfileCard
            promotion={item.promotion}
            scheduledLiveLabel={showOwnerScheduledPreview ? scheduledLiveLabel : null}
            onOwnerEdit={
              showOwnerScheduledPreview && isBusinessOwner
                ? () => handleOwnerEditPromotion(item.promotion.id)
                : undefined
            }
          />
        </Animated.View>
      );
    }

    if (item.kind === 'reviews-empty') {
      return (
        <PublicProfileReviewsPlaceholder
          rating={business.rating}
          reviewCount={business.reviewCount}
        />
      );
    }

    if (item.kind === 'reviews-panel') {
      return (
        <Animated.View entering={FadeIn.duration(260)}>
          <PublicProfileReviewsPanel
            business={business}
            summary={reviewSummary}
            reviews={supabaseReviews}
            currentUserId={currentUserId ?? null}
            isBusinessOwner={isBusinessOwner}
            hasOwnReview={
              currentUserId != null &&
              supabaseReviews.some((review) => review.authorUserId === currentUserId)
            }
            onLeaveReview={() => {
              void handleOpenReviewEditor();
            }}
            onEditReview={() => {
              void handleOpenReviewEditor();
            }}
            onDeleteReview={handleDeleteReview}
          />
        </Animated.View>
      );
    }

    if (item.kind === 'menu') {
      return (
        <Animated.View entering={FadeIn.duration(260)} style={styles.menuTabWrap}>
          <MenuSectionsList sections={business.menu} />
        </Animated.View>
      );
    }

    if (item.kind === 'post') {
      const counts = profilePostEngagement.getCounts(item.postId);
      return (
        <PublicProfilePhotoPostPreview
          postId={item.postId}
          image={item.image}
          caption={item.caption}
          postedAt={item.postedAt}
          likeCount={counts.likeCount}
          commentCount={counts.commentCount}
          engagementLoading={
            profileSource === 'supabase' &&
            profilePostEngagement.loading &&
            !profilePostEngagement.hasLoaded
          }
          engagementFailed={profileSource === 'supabase' && profilePostEngagement.failed}
          showEngagement={profileSource === 'supabase'}
          onPress={() => handleOpenPostDetail(item.postId)}
        />
      );
    }

    if (item.kind === 'announcement') {
      const counts = profilePostEngagement.getCounts(item.postId);
      return (
        <PublicProfileAnnouncementPostPreview
          caption={item.caption}
          postedAt={item.postedAt}
          likeCount={counts.likeCount}
          commentCount={counts.commentCount}
          engagementLoading={
            profileSource === 'supabase' &&
            profilePostEngagement.loading &&
            !profilePostEngagement.hasLoaded
          }
          engagementFailed={profileSource === 'supabase' && profilePostEngagement.failed}
          showEngagement={profileSource === 'supabase'}
          onPress={() => handleOpenPostDetail(item.postId)}
        />
      );
    }

    if (item.kind === 'event') {
      return (
        <Animated.View entering={FadeInDown.duration(320)} style={styles.tabContentItem}>
          <EventPreviewCard
            draft={item.draft}
            businessName={business.name}
            businessAddress={business.address}
            verified={business.verified}
          />
        </Animated.View>
      );
    }

    if (item.kind === 'review') {
      return (
        <Animated.View entering={FadeInDown.delay(index * 70).duration(320)} style={styles.reviewCardWrap}>
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Image source={{ uri: item.review.avatar }} style={styles.reviewAvatar} contentFit="cover" />
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewAuthor}>{item.review.author}</Text>
                <StarRow rating={item.review.rating} size={12} />
              </View>
              <Text style={styles.reviewDate}>{item.review.date}</Text>
            </View>
            <Text style={styles.reviewText}>{item.review.text}</Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(260)} style={styles.aboutContainer}>
        {business.about ? <Text style={styles.aboutText}>{business.about}</Text> : null}
        <View style={styles.aboutCard}>
          {business.hours ? (
            <View style={styles.aboutRow}>
              <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.aboutRowText}>{business.hours}</Text>
            </View>
          ) : null}
          {business.address ? (
            <View style={styles.aboutRow}>
              <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.aboutRowText}>{business.address}</Text>
            </View>
          ) : null}
          {business.phone ? (
            <View style={styles.aboutRow}>
              <Ionicons name="call-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.aboutRowText}>{business.phone}</Text>
            </View>
          ) : null}
          {business.website ? (
            <View style={styles.aboutRow}>
              <Ionicons name="globe-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.aboutRowText}>{business.website}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.emptyState, { paddingTop: insets.top }]}>
        <ActivityIndicator color={theme.emerald} size="large" />
        <Text style={styles.loadingText}>Loading business profile…</Text>
      </View>
    );
  }

  if (!business || !displayBusiness || !profileSource) {
    return (
      <View style={[styles.emptyState, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Business not found</Text>
        {loadError && loadError !== 'Business not found' ? (
          <Text style={styles.emptySubtitle}>{loadError}</Text>
        ) : null}
        <Pressable onPress={() => router.back()} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={activeTab}
        data={tabRows}
        keyExtractor={(item) => item.key}
        renderItem={renderTabRow}
        extraData={[
          promotionTick,
          isBusinessOwner,
          profilePostEngagement.loading,
          profilePostEngagement.failed,
          profilePostIds.join(','),
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <PublicProfileHeader
            business={displayBusiness}
            insetsTop={insets.top}
            activeTab={activeTab}
            primaryCta={primaryCta}
            following={isFollowing(business.id)}
            saved={saved}
            postCount={postCount}
            onTabChange={handleTabChange}
            onToggleFollow={() => {
              if (primaryCta !== 'follow') {
                return;
              }
              void (async () => {
                const ok = await toggleFollow(business.id);
                if (profileSource === 'supabase' && ok) {
                  await refreshFollowerCount(business.id);
                }
              })();
            }}
            onEditProfile={() => router.push('/business-edit-profile')}
            onToggleSave={() => toggleBusinessSaved(business)}
            onShare={handleShare}
            onOpenReviews={handleOpenReviews}
          />
        }
        ListFooterComponent={<View style={styles.tabPanelFooter} />}
        ListHeaderComponentStyle={styles.listHeader}
      />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    listHeader: {
      zIndex: 1,
    },
    listContent: {
      paddingBottom: 40,
      paddingHorizontal: 16,
    },
    menuTabWrap: {
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
    },
    promotionTabWrap: {
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
    },
    postCard: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      marginBottom: 12,
      ...theme.shadowCard,
    },
    postImage: {
      width: '100%',
      height: 220,
    },
    postBody: {
      padding: 16,
      gap: 6,
    },
    postCaption: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.medium,
    },
    postMeta: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    announcementBody: {
      padding: 16,
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
      fontSize: 18,
      lineHeight: 24,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    announcementMessage: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    tabContentItem: {
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingTop: 0,
      marginBottom: 12,
    },
    reviewCardWrap: {
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    reviewCard: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 10,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    reviewAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
    },
    reviewMeta: {
      flex: 1,
      gap: 4,
    },
    reviewAuthor: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
    },
    reviewDate: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
    },
    reviewText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
    },
    starRow: {
      flexDirection: 'row',
      gap: 2,
    },
    aboutContainer: {
      gap: 14,
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 8,
    },
    aboutText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: BrandFonts.regular,
    },
    aboutCard: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      gap: 12,
    },
    aboutRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    aboutRowText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
      fontFamily: BrandFonts.regular,
    },
    tabPanelFooter: {
      height: 12,
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.border,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      marginBottom: 16,
    },
    emptyState: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
    },
    emptySubtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.medium,
    },
    emptyButton: {
      backgroundColor: theme.emerald,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
    },
    emptyButtonText: {
      color: theme.onEmerald,
      fontFamily: BrandFonts.bold,
    },
  });
}
