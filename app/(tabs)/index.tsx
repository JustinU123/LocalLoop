import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useSavedItems } from '@/contexts/saved-items-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  buildHomeCategoryChips,
  buildNewOnLocalLoopBusinesses,
  buildRecentlyActiveBusinesses,
  filterHomeBusinessesByCategory,
  formatHomeBusinessLocation,
  getHomeDiscoveryBusinesses,
} from '@/services/homeBusinesses';
import type { HomeBusiness, HomeCategoryChip } from '@/types/home-business';
import { getBusinessInitials } from '@/utils/business-initials';
import { homeBusinessToSavedBusiness } from '@/utils/home-business-save';
import { openBusinessProfile } from '@/utils/open-business-profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRENDING_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const GEM_CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

type Category = HomeCategoryChip;

function BusinessCoverImage({
  business,
  style,
  overlayStyle,
  styles,
}: {
  business: HomeBusiness;
  style: object;
  overlayStyle?: object;
  styles: ReturnType<typeof createStyles>;
}) {
  if (business.coverImageUrl) {
    return (
      <>
        <Image
          source={{ uri: business.coverImageUrl }}
          style={style}
          contentFit="cover"
          transition={300}
        />
        {overlayStyle ? <View style={overlayStyle} /> : null}
      </>
    );
  }

  return (
    <View style={[style, styles.coverFallback]}>
      <Text style={styles.coverFallbackText}>{getBusinessInitials(business.name)}</Text>
    </View>
  );
}

function SectionEmpty({
  title,
  body,
  styles,
}: {
  title: string;
  body: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sectionEmpty}>
      <Text style={styles.sectionEmptyTitle}>{title}</Text>
      <Text style={styles.sectionEmptyBody}>{body}</Text>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryChip({
  category,
  selected,
  onPress,
  theme,
  styles,
}: {
  category: Category;
  selected: boolean;
  onPress: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(selected ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.6,
    });
  }, [selected, progress]);

  const chipBackground = theme.surfaceElevated;
  const chipBackgroundSelected = theme.emerald;
  const chipBorder = theme.borderLight;
  const chipBorderSelected = theme.emerald;
  const labelColor = theme.textSecondary;
  const labelColorSelected = theme.onEmerald;

  const animatedChipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [chipBackground, chipBackgroundSelected]),
    borderColor: interpolateColor(progress.value, [0, 1], [chipBorder, chipBorderSelected]),
    transform: [{ scale: 1 + progress.value * 0.04 }],
  }), [chipBackground, chipBackgroundSelected, chipBorder, chipBorderSelected]);

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [labelColor, labelColorSelected]),
  }), [labelColor, labelColorSelected]);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.chip, animatedChipStyle]}>
      <Ionicons
        name={category.icon as keyof typeof Ionicons.glyphMap}
        size={15}
        color={selected ? theme.onEmerald : theme.textSecondary}
      />
      <Animated.Text style={[styles.chipLabel, animatedLabelStyle]}>
        {category.label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

function SaveButton({
  saved,
  onPress,
  theme,
  styles,
}: {
  saved: boolean;
  onPress: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
      hitSlop={8}>
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={18}
        color={saved ? theme.emerald : theme.onImage}
      />
    </Pressable>
  );
}

type FeaturedBadgeVariant = 'verified' | 'promotional' | 'neutral';

function FeaturedBusinessCard({
  business,
  badge,
  badgeVariant = 'neutral',
  saved,
  onToggleSave,
  theme,
  styles,
}: {
  business: HomeBusiness;
  badge: string;
  badgeVariant?: FeaturedBadgeVariant;
  saved: boolean;
  onToggleSave: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  const location = formatHomeBusinessLocation(business);

  const badgeStyle =
    badgeVariant === 'verified'
      ? [styles.trendingBadge, styles.trendingBadgeVerified]
      : badgeVariant === 'promotional'
        ? [styles.trendingBadge, styles.trendingBadgePromotional]
        : [styles.trendingBadge, styles.trendingBadgeNeutral];

  const badgeTextStyle =
    badgeVariant === 'verified'
      ? [styles.trendingBadgeText, styles.trendingBadgeTextVerified]
      : badgeVariant === 'promotional'
        ? [styles.trendingBadgeText, styles.trendingBadgeTextPromotional]
        : [styles.trendingBadgeText, styles.trendingBadgeTextNeutral];

  return (
    <View style={styles.trendingCard}>
      <Pressable
        style={({ pressed }) => [styles.trendingCardPressable, pressed && styles.cardPressed]}
        onPress={() => openBusinessProfile(business.id, { source: 'home' })}>
        <BusinessCoverImage business={business} style={styles.trendingImage} styles={styles} />
        <View pointerEvents="none" style={styles.trendingBottomScrimFade} />
        <View pointerEvents="none" style={styles.trendingBottomScrim} />
        <View style={styles.trendingTopRow}>
          <View style={badgeStyle}>
            <Text style={badgeTextStyle}>{badge}</Text>
          </View>
        </View>
        <View style={styles.trendingFooter}>
          <Text style={styles.trendingName} numberOfLines={2}>
            {business.name}
          </Text>
          <View style={styles.trendingMeta}>
            <Text style={styles.trendingCategory} numberOfLines={1}>
              {business.category}
            </Text>
            {location ? (
              <Text style={styles.trendingLocation} numberOfLines={1}>
                {location}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
      <View style={styles.trendingSaveWrap}>
        <SaveButton saved={saved} onPress={onToggleSave} theme={theme} styles={styles} />
      </View>
    </View>
  );
}

function CompactBusinessCard({
  business,
  saved,
  onToggleSave,
  theme,
  styles,
}: {
  business: HomeBusiness;
  saved: boolean;
  onToggleSave: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  const location = formatHomeBusinessLocation(business);

  return (
    <View style={styles.gemCard}>
      <Pressable
        style={({ pressed }) => [pressed && styles.cardPressed]}
        onPress={() => openBusinessProfile(business.id, { source: 'home' })}>
        <View style={styles.gemImageWrap}>
          <BusinessCoverImage business={business} style={styles.gemImage} styles={styles} />
        </View>
        <View style={styles.gemBody}>
          <Text style={styles.gemName} numberOfLines={2}>
            {business.name}
          </Text>
          <Text style={styles.gemCategory} numberOfLines={1}>
            {business.category}
          </Text>
          {location ? (
            <Text style={styles.gemLocation} numberOfLines={1}>
              {location}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.gemSaveWrap}>
        <SaveButton saved={saved} onPress={onToggleSave} theme={theme} styles={styles} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { isBusinessSaved, toggleBusinessSaved } = useSavedItems();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [businesses, setBusinesses] = useState<HomeBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const loadBusinesses = useCallback(async (mode: 'initial' | 'silent' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    }

    const result = await getHomeDiscoveryBusinesses();

    if (mode === 'initial') {
      setLoading(false);
    }

    if (!result.ok) {
      setErrorMessage(result.message);
      if (__DEV__) {
        console.error('[home-screen:loadBusinesses]', result.message);
      }
      return;
    }

    setErrorMessage(null);
    setBusinesses(result.businesses);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const mode = hasLoadedOnceRef.current ? 'silent' : 'initial';
      void loadBusinesses(mode).finally(() => {
        hasLoadedOnceRef.current = true;
      });
    }, [loadBusinesses]),
  );

  const handleCategoryPress = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(id);
  };

  const categories = useMemo(() => buildHomeCategoryChips(businesses), [businesses]);

  const filteredBusinesses = useMemo(
    () => filterHomeBusinessesByCategory(businesses, selectedCategory),
    [businesses, selectedCategory],
  );

  const nearbyBusinesses = filteredBusinesses;
  const recentlyActiveBusinesses = useMemo(
    () => buildRecentlyActiveBusinesses(filteredBusinesses),
    [filteredBusinesses],
  );
  const newBusinesses = useMemo(
    () => buildNewOnLocalLoopBusinesses(filteredBusinesses),
    [filteredBusinesses],
  );

  if (loading && businesses.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <LocalLoopWordmark style={styles.headerWordmark} />
            <Text style={styles.title}>Discover Local</Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => router.push('/settings')}>
            <Ionicons name="person-circle-outline" size={30} color={theme.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.emerald} size="large" />
          <Text style={styles.loadingText}>Loading local businesses…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage && businesses.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <LocalLoopWordmark style={styles.headerWordmark} />
            <Text style={styles.title}>Discover Local</Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => router.push('/settings')}>
            <Ionicons name="person-circle-outline" size={30} color={theme.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Unable to load businesses</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            onPress={() => {
              void loadBusinesses('initial');
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
      <View style={styles.header}>
        <View>
          <LocalLoopWordmark style={styles.headerWordmark} />
          <Text style={styles.title}>Discover Local</Text>
        </View>
        <Pressable style={styles.profileButton} onPress={() => router.push('/settings')}>
          <Ionicons name="person-circle-outline" size={30} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.stickyHeader}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              placeholder="Search restaurants, coffee, boutiques..."
              placeholderTextColor={theme.textSecondary}
              style={styles.searchInput}
            />
            <Pressable style={styles.filterButton}>
              <Ionicons name="options-outline" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                selected={selectedCategory === category.id}
                onPress={() => handleCategoryPress(category.id)}
                theme={theme}
                styles={styles}
              />
            ))}
          </ScrollView>
        </View>

        <Animated.View
          key={selectedCategory}
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(180)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Local Businesses</Text>
            <Text style={styles.sectionCount}>{nearbyBusinesses.length} verified</Text>
          </View>

          {nearbyBusinesses.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={TRENDING_CARD_WIDTH + 14}
              contentContainerStyle={styles.trendingRow}>
              {nearbyBusinesses.map((business) => (
                <FeaturedBusinessCard
                  key={`nearby-${business.id}`}
                  business={business}
                  badge="Verified local"
                  badgeVariant="verified"
                  saved={isBusinessSaved(business.id)}
                  onToggleSave={() => toggleBusinessSaved(homeBusinessToSavedBusiness(business))}
                  theme={theme}
                  styles={styles}
                />
              ))}
            </ScrollView>
          ) : (
            <SectionEmpty
              title="No additional businesses nearby yet."
              body="More local businesses are joining soon."
              styles={styles}
            />
          )}

          <View style={[styles.sectionHeader, styles.gemsSectionHeader]}>
            <Text style={styles.sectionTitle}>Recently Active</Text>
            <Text style={styles.sectionCountAccent}>{recentlyActiveBusinesses.length} active</Text>
          </View>

          {recentlyActiveBusinesses.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={TRENDING_CARD_WIDTH + 14}
              contentContainerStyle={styles.trendingRow}>
              {recentlyActiveBusinesses.map((business) => (
                <FeaturedBusinessCard
                  key={`active-${business.id}`}
                  business={business}
                  badge="Recently active"
                  badgeVariant="neutral"
                  saved={isBusinessSaved(business.id)}
                  onToggleSave={() => toggleBusinessSaved(homeBusinessToSavedBusiness(business))}
                  theme={theme}
                  styles={styles}
                />
              ))}
            </ScrollView>
          ) : (
            <SectionEmpty
              title="No recently active businesses yet."
              body="More local businesses are joining soon."
              styles={styles}
            />
          )}

          <View style={[styles.sectionHeader, styles.gemsSectionHeader]}>
            <Text style={styles.sectionTitle}>New on LocalLoop</Text>
            <Text style={styles.sectionCountAccent}>{newBusinesses.length} new</Text>
          </View>

          {newBusinesses.length > 0 ? (
            <View style={styles.gemGrid}>
              {newBusinesses.map((business) => (
                <CompactBusinessCard
                  key={`new-${business.id}`}
                  business={business}
                  saved={isBusinessSaved(business.id)}
                  onToggleSave={() => toggleBusinessSaved(homeBusinessToSavedBusiness(business))}
                  theme={theme}
                  styles={styles}
                />
              ))}
            </View>
          ) : (
            <SectionEmpty
              title="No new businesses yet."
              body="More local businesses are joining soon."
              styles={styles}
            />
          )}
        </Animated.View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.mapFab, pressed && styles.mapFabPressed]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/map');
        }}>
        <Ionicons name="map" size={22} color={theme.onCoral} />
        <Text style={styles.mapFabLabel}>Map</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
  },
  headerWordmark: {
    marginBottom: 10,
  },
  title: {
    color: theme.text,
    fontSize: 34,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.8,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  stickyHeader: {
    backgroundColor: theme.bg,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: BrandRadius.sm,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    fontFamily: BrandFonts.regular,
    paddingVertical: 0,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BrandRadius.pill,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: BrandFonts.semiBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  gemsSectionHeader: {
    marginTop: 30,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 22,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: theme.coral,
    fontSize: 15,
    fontFamily: BrandFonts.semiBold,
  },
  sectionCount: {
    color: theme.textSecondary,
    fontSize: 14,
    fontFamily: BrandFonts.medium,
  },
  sectionCountAccent: {
    color: theme.coral,
    fontSize: 14,
    fontFamily: BrandFonts.semiBold,
  },
  trendingRow: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 4,
  },
  trendingCard: {
    width: TRENDING_CARD_WIDTH,
    height: 288,
    borderRadius: BrandRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.surfaceElevated,
    position: 'relative',
    ...theme.shadowCard,
  },
  trendingCardPressable: {
    flex: 1,
  },
  trendingSaveWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 3,
  },
  trendingImage: {
    ...StyleSheet.absoluteFillObject,
  },
  trendingBottomScrimFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 108,
    height: 52,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  trendingBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 108,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  trendingTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 56,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  trendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BrandRadius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  trendingBadgeVerified: {
    backgroundColor: theme.emerald,
    borderColor: theme.emeraldDark,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  trendingBadgePromotional: {
    backgroundColor: theme.coral,
    borderColor: theme.coral,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  trendingBadgeNeutral: {
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  trendingBadgeText: {
    fontSize: 10,
    fontFamily: BrandFonts.semiBold,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  trendingBadgeTextVerified: {
    color: theme.onEmerald,
  },
  trendingBadgeTextPromotional: {
    color: theme.onCoral,
  },
  trendingBadgeTextNeutral: {
    color: theme.onImage,
  },
  trendingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 14,
    gap: 8,
    zIndex: 2,
  },
  trendingName: {
    color: theme.onImage,
    fontSize: 21,
    lineHeight: 26,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.35,
  },
  trendingMeta: {
    gap: 3,
  },
  trendingCategory: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: BrandFonts.medium,
  },
  trendingLocation: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: BrandFonts.regular,
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.emeraldGlow,
  },
  coverFallbackText: {
    color: theme.emerald,
    fontSize: 28,
    fontFamily: BrandFonts.bold,
  },
  sectionEmpty: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 6,
  },
  sectionEmptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontFamily: BrandFonts.semiBold,
  },
  sectionEmptyBody: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BrandFonts.regular,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
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
  saveButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  gemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  gemCard: {
    width: GEM_CARD_WIDTH,
    borderRadius: BrandRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.border,
    position: 'relative',
    ...theme.shadowCard,
  },
  gemImageWrap: {
    height: 118,
    position: 'relative',
    backgroundColor: theme.surfaceElevated,
  },
  gemImage: {
    width: '100%',
    height: '100%',
  },
  gemSaveWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  gemBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 4,
  },
  gemName: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.15,
  },
  gemCategory: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: BrandFonts.medium,
  },
  gemLocation: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: BrandFonts.regular,
    marginTop: 1,
  },
  mapFab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: BrandRadius.pill,
    backgroundColor: theme.coral,
    shadowColor: theme.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  mapFabPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  mapFabLabel: {
    color: theme.onCoral,
    fontSize: 16,
    fontFamily: BrandFonts.bold,
  },
  });
}
