import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
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

import { LocalLoopHeaderLogo } from '@/components/brand/local-loop-header-logo';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { BUSINESSES, type Business } from '@/data/businesses';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRENDING_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const GEM_CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

type Category = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt' },
  { id: 'coffee', label: 'Coffee', icon: 'cafe' },
  { id: 'beauty', label: 'Beauty', icon: 'sparkles' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell' },
  { id: 'more', label: 'More', icon: 'grid' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function openBusinessProfile(id: string) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(`/business/${id}`);
}

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
        name={category.icon}
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

function TrendingCard({
  business,
  saved,
  onToggleSave,
  theme,
  styles,
}: {
  business: Business;
  saved: boolean;
  onToggleSave: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.trendingCard}>
      <Pressable
        style={({ pressed }) => [styles.trendingCardPressable, pressed && styles.cardPressed]}
        onPress={() => openBusinessProfile(business.id)}>
        <Image source={{ uri: business.image }} style={styles.trendingImage} contentFit="cover" transition={300} />
        <View style={styles.imageOverlay} />
        <View style={styles.trendingTopRow}>
          <View style={styles.trendingBadge}>
            <Text style={styles.trendingBadgeText}>Trending</Text>
          </View>
        </View>
        <View style={styles.trendingFooter}>
          <Text style={styles.trendingName}>{business.name}</Text>
          <View style={styles.trendingMeta}>
            <Text style={styles.trendingCategory}>{business.category}</Text>
            <Text style={styles.trendingDot}>·</Text>
            <Text style={styles.trendingDistance}>{business.distance}</Text>
            <Text style={styles.trendingDot}>·</Text>
            <Ionicons name="star" size={12} color={theme.star} />
            <Text style={styles.trendingRating}>{business.rating.toFixed(1)}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.trendingSaveWrap}>
        <SaveButton saved={saved} onPress={onToggleSave} theme={theme} styles={styles} />
      </View>
    </View>
  );
}

function HiddenGemCard({
  business,
  saved,
  onToggleSave,
  theme,
  styles,
}: {
  business: Business;
  saved: boolean;
  onToggleSave: () => void;
  theme: AppThemeTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.gemCard}>
      <Pressable
        style={({ pressed }) => [pressed && styles.cardPressed]}
        onPress={() => openBusinessProfile(business.id)}>
        <View style={styles.gemImageWrap}>
          <Image source={{ uri: business.image }} style={styles.gemImage} contentFit="cover" transition={300} />
          <View style={styles.gemImageOverlay} />
        </View>
        <View style={styles.gemBody}>
          <Text style={styles.gemName} numberOfLines={1}>
            {business.name}
          </Text>
          <View style={styles.gemMeta}>
            <Text style={styles.gemCategory}>{business.category}</Text>
            <Text style={styles.gemDistance}>{business.distance}</Text>
          </View>
          <View style={styles.gemRatingRow}>
            <Ionicons name="star" size={11} color={theme.star} />
            <Text style={styles.gemRating}>{business.rating.toFixed(1)}</Text>
          </View>
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
  const [selectedCategory, setSelectedCategory] = useState('more');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCategoryPress = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(id);
  };

  const filteredBusinesses = useMemo(() => {
    if (selectedCategory === 'more') return BUSINESSES;
    return BUSINESSES.filter(
      (business) => business.category.toLowerCase() === selectedCategory,
    );
  }, [selectedCategory]);

  const trendingBusinesses = useMemo(
    () => filteredBusinesses.filter((business) => business.trending),
    [filteredBusinesses],
  );

  const hiddenGemBusinesses = useMemo(
    () => filteredBusinesses.filter((business) => business.hiddenGem),
    [filteredBusinesses],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <LocalLoopHeaderLogo style={styles.headerLogo} />
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
            {CATEGORIES.map((category) => (
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
            <Text style={styles.sectionTitle}>Trending</Text>
            <Pressable>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={TRENDING_CARD_WIDTH + 14}
            contentContainerStyle={styles.trendingRow}>
            {trendingBusinesses.map((business) => (
              <TrendingCard
                key={business.id}
                business={business}
                saved={savedIds.has(business.id)}
                onToggleSave={() => toggleSave(business.id)}
                theme={theme}
                styles={styles}
              />
            ))}
          </ScrollView>

          <View style={[styles.sectionHeader, styles.gemsSectionHeader]}>
            <Text style={styles.sectionTitle}>⭐ Hidden Gems</Text>
            <Text style={styles.sectionCountAccent}>{hiddenGemBusinesses.length} spots</Text>
          </View>

          <View style={styles.gemGrid}>
            {hiddenGemBusinesses.map((business) => (
              <HiddenGemCard
                key={business.id}
                business={business}
                saved={savedIds.has(business.id)}
                onToggleSave={() => toggleSave(business.id)}
                theme={theme}
                styles={styles}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.mapFab, pressed && styles.mapFabPressed]}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
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
  headerLogo: {
    marginBottom: 4,
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
    height: 320,
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
    top: 14,
    right: 14,
    zIndex: 2,
  },
  trendingImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.imageScrim,
  },
  trendingTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingBadge: {
    backgroundColor: theme.coralGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BrandRadius.pill,
    borderWidth: 1,
    borderColor: theme.coral,
  },
  trendingBadgeText: {
    color: theme.coral,
    fontSize: 12,
    fontFamily: BrandFonts.bold,
  },
  trendingFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  trendingName: {
    color: theme.onImage,
    fontSize: 24,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingCategory: {
    color: theme.onImageMuted,
    fontSize: 14,
    fontFamily: BrandFonts.semiBold,
  },
  trendingDistance: {
    color: theme.onImageMuted,
    fontSize: 14,
    fontFamily: BrandFonts.regular,
  },
  trendingDot: {
    color: theme.onImageMuted,
    fontSize: 14,
  },
  trendingRating: {
    color: theme.onImage,
    fontSize: 14,
    fontFamily: BrandFonts.bold,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.imageControlBg,
    borderWidth: 1,
    borderColor: theme.imageControlBorder,
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
    height: 128,
    position: 'relative',
  },
  gemImage: {
    width: '100%',
    height: '100%',
  },
  gemImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.imageScrimLight,
  },
  gemSaveWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  gemBody: {
    padding: 12,
  },
  gemName: {
    color: theme.text,
    fontSize: 15,
    fontFamily: BrandFonts.bold,
    marginBottom: 4,
  },
  gemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gemCategory: {
    color: theme.textSecondary,
    fontSize: 12,
    fontFamily: BrandFonts.semiBold,
  },
  gemDistance: {
    color: theme.textSecondary,
    fontSize: 12,
    fontFamily: BrandFonts.regular,
  },
  gemRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gemRating: {
    color: theme.text,
    fontSize: 12,
    fontFamily: BrandFonts.bold,
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
