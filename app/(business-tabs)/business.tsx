import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuickActionRow } from '@/components/business/quick-action-row';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { PLACEHOLDER_BUSINESS_PROFILE } from '@/constants/business-dashboard';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getBusinessEvents } from '@/services/events';
import { formatPostCreatedAt, getBusinessPosts } from '@/services/posts';
import { listOwnerPromotions, type OwnerManagedPromotion } from '@/services/promotions';
import type { BusinessEvent } from '@/types/supabase-event';
import type { BusinessPost } from '@/types/supabase-post';
import { parseAnnouncementCaption } from '@/utils/announcement-form';
import { formatEventSchedule, getEventStatus } from '@/utils/event-form';
import { formatPromotionExpiresLabel } from '@/utils/promotion-display';
import { openBusinessProfile } from '@/utils/open-business-profile';

type DashboardCategory = 'posts' | 'events' | 'promotions';

const DASHBOARD_PILLS: { id: DashboardCategory; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'events', label: 'Events' },
  { id: 'promotions', label: 'Promotions' },
];

const MAX_SUMMARY_ITEMS = 2;

const HAS_MANAGE_POSTS_SCREEN = true;
const HAS_MANAGE_EVENTS_SCREEN = true;

function getPostSummaryLine(post: BusinessPost): string {
  if (post.postType === 'announcement') {
    const { title, message } = parseAnnouncementCaption(post.caption ?? '');
    return title.trim() || message.trim() || 'Announcement';
  }

  return post.caption?.trim() || 'Photo post';
}

function isEventUpcomingForDashboard(event: BusinessEvent): boolean {
  return getEventStatus(event.draft) !== 'Ended';
}

export default function BusinessOwnerDashboardScreen() {
  const styles = useThemedStyles(createStyles);
  const { businessApplication, businessRecord, switchToExplorerMode } = useAccountMode();
  const [selectedCategory, setSelectedCategory] = useState<DashboardCategory>('promotions');

  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsLoadFailed, setPostsLoadFailed] = useState(false);

  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLoadFailed, setEventsLoadFailed] = useState(false);

  const [ownerPromotions, setOwnerPromotions] = useState<OwnerManagedPromotion[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionsLoadFailed, setPromotionsLoadFailed] = useState(false);

  const profile = PLACEHOLDER_BUSINESS_PROFILE;
  const businessName = businessApplication?.businessName?.trim() || profile.name;
  const businessCategory = businessApplication?.category?.trim() || profile.category;
  const biography = businessApplication?.description?.trim() || profile.biography;
  const displayPostCount = posts.length > 0 || !postsLoadFailed ? posts.length : profile.postCount;

  const loadDashboardPosts = useCallback(async () => {
    if (!businessRecord?.id) {
      setPosts([]);
      return;
    }

    setPostsLoading(true);
    setPostsLoadFailed(false);

    const result = await getBusinessPosts(businessRecord.id);
    setPostsLoading(false);

    if (!result.ok) {
      setPostsLoadFailed(true);
      if (__DEV__) {
        console.error('[business-dashboard:loadDashboardPosts]', result.message);
      }
      return;
    }

    setPosts(result.posts);
  }, [businessRecord]);

  const loadDashboardEvents = useCallback(async () => {
    if (!businessRecord?.id) {
      setEvents([]);
      return;
    }

    setEventsLoading(true);
    setEventsLoadFailed(false);

    const result = await getBusinessEvents(businessRecord.id);
    setEventsLoading(false);

    if (!result.ok) {
      setEventsLoadFailed(true);
      if (__DEV__) {
        console.error('[business-dashboard:loadDashboardEvents]', result.message);
      }
      return;
    }

    setEvents(result.events);
  }, [businessRecord]);

  const loadOwnerPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    setPromotionsLoadFailed(false);

    const result = await listOwnerPromotions();
    setPromotionsLoading(false);

    if (!result.ok) {
      setPromotionsLoadFailed(true);
      if (__DEV__) {
        console.error('[business-dashboard:loadOwnerPromotions]', result.message);
      }
      return;
    }

    setOwnerPromotions(result.promotions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboardPosts();
      void loadDashboardEvents();
      void loadOwnerPromotions();
    }, [loadDashboardPosts, loadDashboardEvents, loadOwnerPromotions]),
  );

  const activePromotions = useMemo(
    () => ownerPromotions.filter((promotion) => promotion.lifecycle === 'active'),
    [ownerPromotions],
  );
  const scheduledCount = useMemo(
    () => ownerPromotions.filter((promotion) => promotion.lifecycle === 'scheduled').length,
    [ownerPromotions],
  );

  const upcomingEvents = useMemo(
    () => events.filter(isEventUpcomingForDashboard),
    [events],
  );

  const handlePlaceholderAction = (label: string) => {
    Alert.alert('Coming soon', `${label} will be connected in a future business tools update.`);
  };

  const handleManagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedCategory === 'promotions') {
      router.push('/business-manage-promotions');
      return;
    }

    if (selectedCategory === 'posts') {
      if (HAS_MANAGE_POSTS_SCREEN) {
        router.push('/business-manage-posts');
        return;
      }
      handlePlaceholderAction('Manage Posts');
      return;
    }

    if (HAS_MANAGE_EVENTS_SCREEN) {
      router.push('/business-manage-events');
      return;
    }
    handlePlaceholderAction('Manage Events');
  };

  const openCreatePromotion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/business-create-promotion');
  };

  const openCreatePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(business-tabs)/create');
  };

  const openCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/business-create-event');
  };

  const openManageMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/business-manage-menu');
  };

  const openBusinessSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/business-settings');
  };

  const categoryTitle =
    selectedCategory === 'posts'
      ? 'Posts'
      : selectedCategory === 'events'
        ? 'Events'
        : 'Promotions';

  const renderSummaryContent = () => {
    if (selectedCategory === 'promotions') {
      if (promotionsLoading && ownerPromotions.length === 0) {
        return (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={styles.loader.color} />
            <Text style={styles.sectionBodyMuted}>Loading promotions…</Text>
          </View>
        );
      }

      if (promotionsLoadFailed) {
        return (
          <Text style={styles.sectionBodyMuted}>
            Promotions could not be loaded right now.
          </Text>
        );
      }

      if (activePromotions.length > 0) {
        return (
          <View style={styles.summaryBlock}>
            {activePromotions.slice(0, MAX_SUMMARY_ITEMS).map((promotion) => (
              <View key={promotion.id} style={styles.summaryRow}>
                <Text style={styles.promoTitle} numberOfLines={2}>
                  {promotion.title}
                </Text>
                <Text style={styles.statusActive}>Active</Text>
                <Text style={styles.metaMuted}>{formatPromotionExpiresLabel(promotion.endAt)}</Text>
              </View>
            ))}
            <Text style={styles.countLabel}>
              {activePromotions.length} active promotion{activePromotions.length === 1 ? '' : 's'}
            </Text>
          </View>
        );
      }

      if (scheduledCount > 0) {
        return (
          <View style={styles.summaryBlock}>
            <Text style={styles.sectionBody}>No active promotions</Text>
            <Text style={styles.metaMuted}>
              {scheduledCount} scheduled
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.summaryBlock}>
          <Text style={styles.sectionBody}>No active promotions</Text>
          <Text style={styles.sectionBodyMuted}>Create a promotion to attract nearby customers.</Text>
          <Pressable
            onPress={openCreatePromotion}
            style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
            <Text style={styles.textActionLabel}>Create Promotion</Text>
            <Ionicons name="add-circle-outline" size={16} color={styles.textActionLabel.color} />
          </Pressable>
        </View>
      );
    }

    if (selectedCategory === 'posts') {
      if (postsLoading && posts.length === 0) {
        return (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={styles.loader.color} />
            <Text style={styles.sectionBodyMuted}>Loading posts…</Text>
          </View>
        );
      }

      if (postsLoadFailed) {
        return <Text style={styles.sectionBodyMuted}>Posts could not be loaded right now.</Text>;
      }

      if (posts.length === 0) {
        return (
          <View style={styles.summaryBlock}>
            <Text style={styles.sectionBody}>No posts yet</Text>
            <Text style={styles.sectionBodyMuted}>Share updates with your customers.</Text>
            <Pressable
              onPress={openCreatePost}
              style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
              <Text style={styles.textActionLabel}>Create Post</Text>
              <Ionicons name="add-circle-outline" size={16} color={styles.textActionLabel.color} />
            </Pressable>
          </View>
        );
      }

      return (
        <View style={styles.summaryBlock}>
          <Text style={styles.subheading}>Latest Posts</Text>
          {posts.slice(0, MAX_SUMMARY_ITEMS).map((post) => (
            <View key={post.id} style={styles.postRow}>
              {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={styles.postThumb} contentFit="cover" />
              ) : (
                <View style={[styles.postThumb, styles.postThumbPlaceholder]}>
                  <Ionicons name="document-text-outline" size={18} color={styles.metaMuted.color} />
                </View>
              )}
              <View style={styles.postRowText}>
                <Text style={styles.postLine} numberOfLines={2}>
                  {getPostSummaryLine(post)}
                </Text>
                <Text style={styles.metaMuted}>Posted {formatPostCreatedAt(post.createdAt)}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.countLabel}>
            {posts.length} published post{posts.length === 1 ? '' : 's'}
          </Text>
        </View>
      );
    }

    if (eventsLoading && events.length === 0) {
      return (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={styles.loader.color} />
          <Text style={styles.sectionBodyMuted}>Loading events…</Text>
        </View>
      );
    }

    if (eventsLoadFailed) {
      return <Text style={styles.sectionBodyMuted}>Events could not be loaded right now.</Text>;
    }

    if (upcomingEvents.length === 0) {
      return (
        <View style={styles.summaryBlock}>
          <Text style={styles.sectionBody}>No upcoming events</Text>
          <Text style={styles.sectionBodyMuted}>Create an event for your community.</Text>
          <Pressable
            onPress={openCreateEvent}
            style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
            <Text style={styles.textActionLabel}>Create Event</Text>
            <Ionicons name="add-circle-outline" size={16} color={styles.textActionLabel.color} />
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.summaryBlock}>
        {upcomingEvents.slice(0, MAX_SUMMARY_ITEMS).map((event) => {
          const status = getEventStatus(event.draft);
          return (
            <View key={event.id} style={styles.summaryRow}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.draft.eventName.trim()}
              </Text>
              <Text style={styles.metaMuted}>{formatEventSchedule(event.draft)}</Text>
              <Text style={styles.statusUpcoming}>{status}</Text>
            </View>
          );
        })}
        <Text style={styles.countLabel}>
          {upcomingEvents.length} upcoming event{upcomingEvents.length === 1 ? '' : 's'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="storefront" size={34} color={styles.avatarIcon.color} />
          </View>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.category}>{businessCategory}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>Verified</Text>
          </View>
          <Text style={styles.biography}>{biography}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayPostCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>
        </View>

        <View style={styles.pillRow}>
          {DASHBOARD_PILLS.map((pill) => {
            const selected = selectedCategory === pill.id;
            return (
              <Pressable
                key={pill.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(pill.id);
                }}
                style={[styles.pill, selected && styles.pillSelected]}>
                <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{pill.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{categoryTitle}</Text>
            <Pressable
              onPress={handleManagePress}
              style={({ pressed }) => [styles.sectionLink, pressed && styles.pressed]}>
              <Text style={styles.sectionLinkText}>Manage</Text>
              <Ionicons name="chevron-forward" size={16} color={styles.sectionLinkText.color} />
            </Pressable>
          </View>

          {renderSummaryContent()}
        </View>

        <View style={styles.toolsSection}>
          <Text style={styles.toolsSectionTitle}>Business Tools</Text>
          <View style={styles.managementCard}>
            <QuickActionRow
              label="View Public Profile"
              icon="eye-outline"
              onPress={() => {
                if (businessRecord?.id) {
                  openBusinessProfile(businessRecord.id, { source: 'business-dashboard' });
                }
              }}
            />
            <View style={styles.divider} />
            <QuickActionRow
              label="Manage Products & Menu"
              icon="restaurant-outline"
              onPress={openManageMenu}
            />
            <View style={styles.divider} />
            <QuickActionRow
              label="Business Settings"
              icon="settings-outline"
              onPress={openBusinessSettings}
            />
          </View>
        </View>

        <Pressable
          onPress={() => {
            void switchToExplorerMode();
          }}
          style={({ pressed }) => [styles.explorerSwitch, pressed && styles.pressed]}>
          <Ionicons name="compass-outline" size={18} color={styles.explorerSwitchLabel.color} />
          <Text style={styles.explorerSwitchLabel}>Switch to Local Explorer</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 120,
      gap: 16,
    },
    profileHeader: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 8,
      ...theme.shadowCard,
    },
    avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    avatarIcon: {
      color: theme.emerald,
    },
    businessName: {
      color: theme.text,
      fontSize: 24,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    category: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    verifiedBadge: {
      backgroundColor: theme.emeraldGlow,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    verifiedBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      textTransform: 'uppercase',
    },
    biography: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 14,
      marginTop: 10,
    },
    statItem: {
      alignItems: 'center',
      minWidth: 56,
      gap: 2,
    },
    statValue: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.medium,
    },
    pillRow: {
      flexDirection: 'row',
      gap: 8,
    },
    pill: {
      flex: 1,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.pill,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    pillSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    pillLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    pillLabelSelected: {
      color: theme.emerald,
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 12,
      ...theme.shadowCard,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    sectionLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    sectionLinkText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    sectionBody: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    sectionBodyMuted: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    subheading: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    inlineLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    loader: {
      color: theme.emerald,
    },
    summaryBlock: {
      gap: 10,
    },
    summaryRow: {
      gap: 4,
      paddingVertical: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    promoTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    eventTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.1,
    },
    statusActive: {
      color: theme.emerald,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    statusUpcoming: {
      color: theme.emerald,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    metaMuted: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    countLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
    postRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    postThumb: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: theme.surfaceElevated,
    },
    postThumbPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    postRowText: {
      flex: 1,
      gap: 4,
      justifyContent: 'center',
    },
    postLine: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      lineHeight: 19,
    },
    textAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    textActionLabel: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    toolsSection: {
      gap: 10,
    },
    toolsSectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
      paddingHorizontal: 2,
    },
    managementCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 44,
    },
    explorerSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
    },
    explorerSwitchLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    pressed: {
      opacity: 0.88,
    },
  });
}
