import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import {
  BusinessSectionCard,
} from '@/components/business/business-section-card';
import { DashboardPulseRow } from '@/components/business/dashboard-pulse-row';
import { DashboardPlanTierPill } from '@/components/business/dashboard-plan-tier-pill';
import { WeeklySnapshotCard } from '@/components/business/weekly-snapshot-card';
import { ProfileCompletionCelebration } from '@/components/business/profile-completion-celebration';
import { MetricCard } from '@/components/business/metric-card';
import { QuickActionRow } from '@/components/business/quick-action-row';
import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { BUSINESS_QUICK_ACTIONS } from '@/constants/business-dashboard';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { useWeeklySnapshotPeriodMetrics } from '@/hooks/use-weekly-snapshot-period-metrics';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { showBasicWeeklySnapshot } from '@/utils/analytics-panel-routing';
import { buildWeeklySnapshot } from '@/utils/build-weekly-snapshot';
import { supabase } from '@/lib/supabase';
import { acknowledgeProfileCompletionCelebration } from '@/services/businesses';
import { getOwnerBusinessBranding } from '@/services/businessBranding';
import { getBusinessFollowerCount } from '@/services/businessFollows';
import { getOwnerBusinessHours } from '@/services/businessHours';
import { getBusinessEvents } from '@/services/events';
import { getBusinessPosts } from '@/services/posts';
import { listOwnerPromotions, type OwnerManagedPromotion } from '@/services/promotions';
import type { WeeklyBusinessHours } from '@/types/business-hours';
import type { BusinessEvent } from '@/types/supabase-event';
import type { BusinessPost } from '@/types/supabase-post';
import type { Href } from 'expo-router';
import type { VerificationStatus } from '@/types/account-mode';
import { getVerificationStatusLabel } from '@/utils/account-experience';
import { getGreetingName } from '@/utils/business-dashboard';
import { resolveBusinessLogoUrl } from '@/utils/business-branding-display';
import { getBusinessHoursStatus } from '@/utils/business-open-now';
import { computeProfileCompleteness } from '@/utils/business-profile-completeness';
import { resolveProfileCompletenessDashboardSection } from '@/utils/business-profile-completeness-dashboard';
import { combineDateAndTime } from '@/utils/date-time';
import { formatEventSchedule, getEventStatus } from '@/utils/event-form';
import { buildDashboardPulsePromotionLine } from '@/utils/business-dashboard-pulse-promotion';
import { getOwnerPromotionLifecycle } from '@/utils/promotion-owner';
import { getBusinessInitials } from '@/utils/business-initials';
import { getCurrentSession, getDisplayNameFromUser } from '@/utils/auth';
import { openBusinessProfile } from '@/utils/open-business-profile';

type LoadState = 'idle' | 'loading' | 'ready';

function formatPostedLabel(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const label = parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `Posted ${label}`;
}

function isEventUpcoming(event: BusinessEvent): boolean {
  return getEventStatus(event.draft) !== 'Ended';
}

/** Owner Dashboard display copy only; verification logic unchanged. */
function getDashboardVerificationLabel(status: VerificationStatus): string | null {
  if (status === 'verified') {
    return 'Verified Local';
  }
  return getVerificationStatusLabel(status);
}

function pickNextUpcomingEvent(events: BusinessEvent[]): BusinessEvent | null {
  const ranked = events
    .filter(isEventUpcoming)
    .map((event) => ({
      event,
      startMs: combineDateAndTime(event.draft.eventDate, event.draft.startTime)?.getTime() ?? Infinity,
    }))
    .sort((a, b) => a.startMs - b.startMs);

  return ranked[0]?.event ?? null;
}

export default function BusinessDashboardScreen() {
  const styles = useThemedStyles(createStyles);
  const { businessApplication, businessRecord, verificationStatus } = useAccountMode();
  const { tier: analyticsPlanTier, hasCapability } = useAnalyticsAccess();
  const weeklySnapshotEnabled = showBasicWeeklySnapshot(hasCapability);
  const { engagementPeriod, followersPeriod, refreshPeriodMetrics } = useWeeklySnapshotPeriodMetrics(
    businessRecord?.id,
    weeklySnapshotEnabled,
  );
  const [greeting, setGreeting] = useState('Good evening');

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyBusinessHours | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);

  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followersFailed, setFollowersFailed] = useState(false);

  const [ownerPromotions, setOwnerPromotions] = useState<OwnerManagedPromotion[]>([]);
  const [promotionsFailed, setPromotionsFailed] = useState(false);

  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [eventsFailed, setEventsFailed] = useState(false);

  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [postsFailed, setPostsFailed] = useState(false);

  const [hoursFailed, setHoursFailed] = useState(false);

  const [profileCompletionCelebratedAt, setProfileCompletionCelebratedAt] = useState<
    string | null | undefined
  >(undefined);
  const [celebrationPin, setCelebrationPin] = useState<{ businessId: string; pinned: boolean } | null>(
    null,
  );
  const [promotionPulseNow, setPromotionPulseNow] = useState(() => Date.now());
  const dashboardFocusedRef = useRef(false);
  const celebrationEffectsTriggeredRef = useRef(false);
  const celebrationAckInFlightRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void getCurrentSession().then((session) => {
        if (session?.user) {
          setGreeting(getGreetingName(getDisplayNameFromUser(session.user)));
        }
      });
    }, []),
  );

  const loadDashboard = useCallback(async () => {
    const businessId = businessRecord?.id?.trim();
    if (!businessId) {
      setLoadState('ready');
      return;
    }

    setLoadState('loading');
    setFollowersFailed(false);
    setPromotionsFailed(false);
    setEventsFailed(false);
    setPostsFailed(false);
    setHoursFailed(false);

    const [
      brandingResult,
      hoursResult,
      locationResult,
      followersResult,
      promotionsResult,
      eventsResult,
      postsResult,
    ] = await Promise.all([
      getOwnerBusinessBranding(),
      getOwnerBusinessHours(),
      supabase
        .from('businesses')
        .select('latitude, longitude, profile_completion_celebrated_at')
        .eq('id', businessId)
        .maybeSingle(),
      getBusinessFollowerCount(businessId),
      listOwnerPromotions(),
      getBusinessEvents(businessId),
      getBusinessPosts(businessId),
    ]);

    if (brandingResult.ok) {
      setLogoUrl(brandingResult.branding.logoUrl);
      setCoverUrl(brandingResult.branding.coverImageUrl);
    }


    if (hoursResult.ok) {
      setWeeklyHours(hoursResult.hours.weeklyHours);
      setTimezone(hoursResult.hours.timezone);
    } else {
      setHoursFailed(true);
      setWeeklyHours(null);
      setTimezone(null);
    }

    if (!locationResult.error && locationResult.data) {
      const row = locationResult.data as {
        latitude: number | null;
        longitude: number | null;
        profile_completion_celebrated_at?: string | null;
      };
      setLatitude(row.latitude ?? null);
      setLongitude(row.longitude ?? null);
      setProfileCompletionCelebratedAt(row.profile_completion_celebrated_at ?? null);
    } else if (locationResult.error) {
      if (__DEV__) {
        console.error('[business-dashboard] business row load failed', locationResult.error);
      }
      setProfileCompletionCelebratedAt(
        businessRecord?.profile_completion_celebrated_at ?? null,
      );
    }

    if (followersResult.ok) {
      setFollowerCount(followersResult.count);
    } else {
      setFollowersFailed(true);
      setFollowerCount(null);
    }

    if (promotionsResult.ok) {
      setOwnerPromotions(promotionsResult.promotions);
    } else {
      setPromotionsFailed(true);
      setOwnerPromotions([]);
    }

    if (eventsResult.ok) {
      setEvents(eventsResult.events);
    } else {
      setEventsFailed(true);
      setEvents([]);
    }

    if (postsResult.ok) {
      setPosts(postsResult.posts);
    } else {
      setPostsFailed(true);
      setPosts([]);
    }

    setLoadState('ready');
  }, [businessRecord?.id, businessRecord?.profile_completion_celebrated_at]);

  useFocusEffect(
    useCallback(() => {
      dashboardFocusedRef.current = true;
      setPromotionPulseNow(Date.now());
      void loadDashboard();
      if (weeklySnapshotEnabled) {
        void refreshPeriodMetrics();
      }

      const pulseIntervalId = setInterval(() => {
        setPromotionPulseNow(Date.now());
      }, 60_000);

      return () => {
        clearInterval(pulseIntervalId);
        dashboardFocusedRef.current = false;
        setCelebrationPin(null);
        celebrationEffectsTriggeredRef.current = false;
        celebrationAckInFlightRef.current = false;
      };
    }, [loadDashboard, refreshPeriodMetrics, weeklySnapshotEnabled]),
  );

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';
  const category = businessApplication?.category?.trim();
  const city = businessApplication?.city?.trim();
  const state = businessApplication?.state?.trim();
  const locationLabel = [city, state].filter(Boolean).join(', ');

  const verificationLabel = getDashboardVerificationLabel(verificationStatus);

  const completeness = useMemo(
    () =>
      computeProfileCompleteness({
        business: businessRecord,
        logoUrl,
        coverUrl,
        weeklyHours,
        latitude,
        longitude,
      }),
    [businessRecord, logoUrl, coverUrl, weeklyHours, latitude, longitude],
  );

  const celebrationPinnedForFocusedVisit = useMemo(() => {
    const businessId = businessRecord?.id?.trim();
    if (!businessId || !celebrationPin?.pinned) {
      return false;
    }
    return celebrationPin.businessId === businessId;
  }, [businessRecord?.id, celebrationPin]);

  const completenessSection = useMemo(
    () =>
      resolveProfileCompletenessDashboardSection({
        percentage: completeness.percentage,
        profileCompletionCelebratedAt,
        celebrationPinnedForFocusedVisit,
      }),
    [celebrationPinnedForFocusedVisit, completeness.percentage, profileCompletionCelebratedAt],
  );

  useEffect(() => {
    if (completenessSection !== 'celebration') {
      return;
    }

    if (celebrationEffectsTriggeredRef.current) {
      return;
    }
    celebrationEffectsTriggeredRef.current = true;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const businessId = businessRecord?.id?.trim();
    if (!businessId || profileCompletionCelebratedAt !== null) {
      return;
    }

    if (celebrationAckInFlightRef.current) {
      return;
    }

    celebrationAckInFlightRef.current = true;
    void acknowledgeProfileCompletionCelebration(businessId).then((result) => {
      celebrationAckInFlightRef.current = false;
      if (result.ok) {
        setProfileCompletionCelebratedAt(result.celebratedAt);
        if (dashboardFocusedRef.current) {
          setCelebrationPin({ businessId, pinned: true });
        }
        return;
      }

      if (__DEV__) {
        console.error('[business-dashboard] profile completion acknowledgement failed', {
          businessId,
          code: result.code,
          message: result.message,
        });
      }
    });
  }, [businessRecord?.id, completenessSection, profileCompletionCelebratedAt]);

  const resolvedLogo = resolveBusinessLogoUrl({ logoUrl });

  const ownerPromotionLifecycleNow = useMemo(
    () => new Date(promotionPulseNow),
    [promotionPulseNow],
  );

  const activePromotions = useMemo(
    () =>
      ownerPromotions.filter(
        (promotion) =>
          getOwnerPromotionLifecycle(
            {
              status: promotion.status,
              start_at: promotion.startAt,
              end_at: promotion.endAt,
            },
            ownerPromotionLifecycleNow,
          ) === 'active',
      ),
    [ownerPromotions, ownerPromotionLifecycleNow],
  );

  const upcomingEvents = useMemo(() => events.filter(isEventUpcoming), [events]);
  const nextEvent = useMemo(() => pickNextUpcomingEvent(events), [events]);
  const latestPost = posts[0] ?? null;

  const hoursStatus = useMemo(() => {
    if (hoursFailed || !weeklyHours || !timezone?.trim()) {
      return { ok: false as const, reason: 'missing_timezone' as const };
    }
    return getBusinessHoursStatus({
      weeklyHours,
      timezone: timezone.trim(),
      at: new Date(),
    });
  }, [hoursFailed, weeklyHours, timezone]);

  const handleQuickAction = (action: (typeof BUSINESS_QUICK_ACTIONS)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (action.id) {
      case 'create-post':
        router.push('/business-create-photo');
        return;
      case 'create-promotion':
        router.push('/business-create-promotion');
        return;
      case 'edit-profile':
        router.push('/business-edit-profile');
        return;
      case 'view-public-profile': {
        const businessId = businessRecord?.id?.trim();
        if (!businessId) {
          Alert.alert(
            'Business profile unavailable',
            'Your verified business record is still loading. Try again in a moment.',
          );
          return;
        }
        openBusinessProfile(businessId, { source: 'business-dashboard' });
        return;
      }
    }
  };

  const glanceLoading = loadState === 'loading' && followerCount === null && !followersFailed;

  const followerDisplay = followersFailed ? '—' : glanceLoading ? '…' : String(followerCount ?? 0);

  const promotionsDisplay = promotionsFailed
    ? '—'
    : loadState === 'loading' && ownerPromotions.length === 0 && !promotionsFailed
      ? '…'
      : String(activePromotions.length);

  const eventsDisplay = eventsFailed
    ? '—'
    : loadState === 'loading' && events.length === 0 && !eventsFailed
      ? '…'
      : String(upcomingEvents.length);

  const weeklySnapshot = useMemo(
    () =>
      buildWeeklySnapshot({
        postsLoading: loadState === 'loading' || loadState === 'idle',
        postsFailed,
        posts,
        engagementPeriod,
        followersPeriod,
      }),
    [loadState, postsFailed, posts, engagementPeriod, followersPeriod],
  );

  const pulsePromotionLine = useMemo(
    () =>
      buildDashboardPulsePromotionLine({
        promotions: ownerPromotions,
        now: ownerPromotionLifecycleNow,
        failed: promotionsFailed,
      }),
    [ownerPromotions, ownerPromotionLifecycleNow, promotionsFailed],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <LocalLoopWordmark style={styles.wordmark} />
            <Text style={styles.greeting}>{greeting}</Text>
            <View style={styles.modeBadgeRow}>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>Business Mode</Text>
              </View>
              <DashboardPlanTierPill tier={analyticsPlanTier} />
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(business-tabs)/activity');
              }}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel="Activity and notifications">
              <Ionicons name="notifications-outline" size={20} color={styles.headerIcon.color} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (__DEV__) {
                  console.info('[business-dashboard] profile icon -> router.push(/settings)');
                }
                router.push('/settings');
              }}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel="Account and settings">
              <Ionicons name="person" size={20} color={styles.headerIcon.color} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/business-settings');
          }}
          style={({ pressed }) => [styles.businessCard, pressed && styles.businessCardPressed]}>
          <View style={styles.businessCardHeader}>
            {resolvedLogo ? (
              <Image source={{ uri: resolvedLogo }} style={styles.businessLogo} contentFit="cover" />
            ) : (
              <View style={styles.businessIconWrap}>
                <Text style={styles.businessInitials}>{getBusinessInitials(businessName)}</Text>
              </View>
            )}
            <View style={styles.businessCardText}>
              <Text style={styles.businessName}>{businessName}</Text>
              {verificationLabel ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>{verificationLabel}</Text>
                </View>
              ) : null}
              {category ? <Text style={styles.businessMeta}>{category}</Text> : null}
              {locationLabel ? <Text style={styles.businessMeta}>{locationLabel}</Text> : null}
            </View>
          </View>

          {completenessSection === 'celebration-meta-loading' ? (
            <View style={styles.completenessMetaLoading}>
              <ActivityIndicator size="small" color={styles.loader.color} />
            </View>
          ) : null}

          {completenessSection === 'progress' ? (
            <>
              <Text style={styles.completenessLabel}>Profile completeness</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completeness.percentage}%` }]} />
              </View>
              <Text style={styles.completenessValue}>{completeness.percentage}%</Text>
              {completeness.nextStep ? (
                <Text style={styles.nextStepText}>{completeness.nextStep}</Text>
              ) : null}
              {completeness.nextStepRoute && completeness.actionLabel ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(completeness.nextStepRoute as Href);
                  }}
                  style={styles.completeProfileButton}>
                  <Text style={styles.completeProfileButtonText}>{completeness.actionLabel}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {completenessSection === 'celebration' ? <ProfileCompletionCelebration /> : null}
        </Pressable>

        {weeklySnapshotEnabled ? <WeeklySnapshotCard snapshot={weeklySnapshot} /> : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>At a Glance</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(business-tabs)/analytics');
            }}
            style={styles.analyticsLink}
            accessibilityRole="button"
            accessibilityLabel="View Analytics">
            <Text style={styles.analyticsLinkText}>View Analytics</Text>
            <Ionicons name="chevron-forward" size={14} color={styles.analyticsLinkText.color} />
          </Pressable>
        </View>

        <View style={styles.glanceGrid}>
          <View style={styles.glanceTile}>
            <MetricCard
              compact
              icon="people-outline"
              iconTone="emerald"
              label="Followers"
              value={followerDisplay}
            />
          </View>
          <View style={styles.glanceTile}>
            <MetricCard
              compact
              icon="pricetag-outline"
              iconTone="amber"
              label="Active Promotions"
              value={promotionsDisplay}
            />
          </View>
          <View style={styles.glanceTile}>
            <MetricCard
              compact
              icon="calendar-outline"
              iconTone="gold"
              label="Upcoming Events"
              value={eventsDisplay}
            />
          </View>
        </View>

        <BusinessSectionCard title="Business Pulse">
          {hoursFailed ? (
            <DashboardPulseRow
              tone="emerald"
              icon="time-outline"
              primaryLine="Business hours unavailable"
              secondaryLine="Try again later"
            />
          ) : loadState === 'loading' && weeklyHours === null && timezone === null ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={styles.loader.color} />
            </View>
          ) : hoursStatus.ok ? (
            <DashboardPulseRow
              tone="emerald"
              icon="time-outline"
              primaryLine={hoursStatus.primaryLine}
              secondaryLine={hoursStatus.secondaryLine}
              onPress={() => router.push('/business-settings-hours')}
            />
          ) : (
            <DashboardPulseRow
              tone="emerald"
              icon="time-outline"
              primaryLine="Add business hours"
              secondaryLine="Help customers know when you're open"
              onPress={() => router.push('/business-settings-hours')}
            />
          )}

          {postsFailed ? null : latestPost ? (
            <>
              <View style={styles.pulseDivider} />
              <DashboardPulseRow
                tone="coral"
                icon="flame"
                primaryLine="Latest post"
                secondaryLine={formatPostedLabel(latestPost.createdAt)}
                onPress={() => router.push('/business-manage-posts')}
              />
            </>
          ) : loadState === 'ready' ? (
            <>
              <View style={styles.pulseDivider} />
              <DashboardPulseRow
                tone="coral"
                icon="flame"
                primaryLine="No posts yet"
                secondaryLine="Share a photo to reach nearby customers"
                onPress={() => router.push('/business-create-photo')}
              />
            </>
          ) : null}

          {pulsePromotionLine ? (
            <>
              <View style={styles.pulseDivider} />
              <DashboardPulseRow
                tone="amber"
                icon="pricetag-outline"
                primaryLine={pulsePromotionLine.primary}
                secondaryLine={pulsePromotionLine.secondary}
                onPress={() => router.push('/business-manage-promotions')}
              />
            </>
          ) : null}

          {!eventsFailed && nextEvent ? (
            <>
              <View style={styles.pulseDivider} />
              <DashboardPulseRow
                tone="gold"
                icon="calendar-outline"
                primaryLine="Upcoming event"
                secondaryLine={`${nextEvent.draft.eventName.trim() || 'Event'} · ${formatEventSchedule(nextEvent.draft)}`}
                onPress={() => router.push('/business-manage-events')}
              />
            </>
          ) : null}
        </BusinessSectionCard>

        <BusinessSectionCard title="Quick Actions">
          {BUSINESS_QUICK_ACTIONS.map((action, index) => (
            <View key={action.id}>
              <QuickActionRow
                label={action.label}
                icon={action.icon}
                onPress={() => handleQuickAction(action)}
              />
              {index < BUSINESS_QUICK_ACTIONS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </BusinessSectionCard>
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
      gap: 18,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerCopy: {
      flex: 1,
      gap: 6,
    },
    wordmark: {
      marginBottom: 2,
    },
    greeting: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.6,
    },
    modeBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      flexWrap: 'nowrap',
    },
    modeBadge: {
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    modeBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerIconButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIcon: {
      color: theme.textSecondary,
    },
    businessCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 7,
      ...theme.shadowCard,
    },
    businessCardPressed: {
      opacity: 0.92,
    },
    businessCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    businessLogo: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    businessIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    businessInitials: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.bold,
    },
    businessCardText: {
      flex: 1,
      gap: 3,
    },
    businessName: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
    },
    verifiedBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    verifiedBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
    },
    businessMeta: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    completenessMetaLoading: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      alignItems: 'center',
      paddingVertical: 8,
    },
    completenessLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      marginTop: 2,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.surfaceElevated,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.emerald,
      borderRadius: 999,
    },
    completenessValue: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    nextStepText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
      lineHeight: 17,
    },
    completeProfileButton: {
      alignSelf: 'flex-start',
      marginTop: 2,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    completeProfileButtonText: {
      color: theme.emerald,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
    },
    analyticsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    analyticsLinkText: {
      color: theme.emerald,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    glanceGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    glanceTile: {
      flex: 1,
      minWidth: 0,
    },
    inlineLoading: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    loader: {
      color: theme.emerald,
    },
    pulseDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginHorizontal: 14,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 44,
    },
  });
}
