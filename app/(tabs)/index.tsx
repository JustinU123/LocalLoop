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

import { BrandFonts, BrandRadius, BrandShadow, BusinessTheme as T } from '@/constants/business-theme';
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
}: {
  category: Category;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(selected ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.6,
    });
  }, [selected, progress]);

  const animatedChipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [T.surfaceElevated, T.emerald]),
    borderColor: interpolateColor(progress.value, [0, 1], [T.borderLight, T.emerald]),
    transform: [{ scale: 1 + progress.value * 0.04 }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [T.textSecondary, T.onEmerald]),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.chip, animatedChipStyle]}>
      <Ionicons
        name={category.icon}
        size={15}
        color={selected ? T.onEmerald : T.text}
      />
      <Animated.Text style={[styles.chipLabel, animatedLabelStyle]}>
        {category.label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

function SaveButton({ saved, onPress }: { saved: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
      hitSlop={8}>
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={18}
        color={saved ? T.coral : '#FFFFFF'}
      />
    </Pressable>
  );
}

function TrendingCard({
  business,
  saved,
  onToggleSave,
}: {
  business: Business;
  saved: boolean;
  onToggleSave: () => void;
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
            <Ionicons name="star" size={12} color="#FFD60A" />
            <Text style={styles.trendingRating}>{business.rating.toFixed(1)}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.trendingSaveWrap}>
        <SaveButton saved={saved} onPress={onToggleSave} />
      </View>
    </View>
  );
}

function HiddenGemCard({
  business,
  saved,
  onToggleSave,
}: {
  business: Business;
  saved: boolean;
  onToggleSave: () => void;
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
            <Ionicons name="star" size={11} color="#FFD60A" />
            <Text style={styles.gemRating}>{business.rating.toFixed(1)}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.gemSaveWrap}>
        <SaveButton saved={saved} onPress={onToggleSave} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
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
          <Text style={styles.eyebrow}>LocalLoop</Text>
          <Text style={styles.title}>Discover Local</Text>
        </View>
        <Pressable style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={30} color={T.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.stickyHeader}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={T.textSecondary} />
            <TextInput
              placeholder="Search restaurants, coffee, boutiques..."
              placeholderTextColor={T.textSecondary}
              style={styles.searchInput}
            />
            <Pressable style={styles.filterButton}>
              <Ionicons name="options-outline" size={18} color={T.text} />
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
              />
            ))}
          </ScrollView>

          <View style={[styles.sectionHeader, styles.gemsSectionHeader]}>
            <Text style={styles.sectionTitle}>⭐ Hidden Gems</Text>
            <Text style={styles.sectionCount}>{hiddenGemBusinesses.length} spots</Text>
          </View>

          <View style={styles.gemGrid}>
            {hiddenGemBusinesses.map((business) => (
              <HiddenGemCard
                key={business.id}
                business={business}
                saved={savedIds.has(business.id)}
                onToggleSave={() => toggleSave(business.id)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.mapFab, pressed && styles.mapFabPressed]}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
        <Ionicons name="map" size={22} color="#FFFFFF" />
        <Text style={styles.mapFabLabel}>Map</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
  },
  eyebrow: {
    color: T.emerald,
    fontSize: 12,
    fontFamily: BrandFonts.semiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: T.text,
    fontSize: 34,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.8,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.surfaceElevated,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  stickyHeader: {
    backgroundColor: T.bg,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.border,
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
    backgroundColor: T.surfaceElevated,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: T.text,
    fontSize: 16,
    fontFamily: BrandFonts.regular,
    paddingVertical: 0,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: T.border,
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
    color: T.text,
    fontSize: 22,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: T.coral,
    fontSize: 15,
    fontFamily: BrandFonts.semiBold,
  },
  sectionCount: {
    color: T.textSecondary,
    fontSize: 14,
    fontFamily: BrandFonts.medium,
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
    backgroundColor: T.surfaceElevated,
    position: 'relative',
    ...BrandShadow.card,
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
    backgroundColor: 'rgba(0,0,0,0.22)',
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BrandRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  trendingBadgeText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    color: T.text,
    fontSize: 14,
    fontFamily: BrandFonts.semiBold,
  },
  trendingDistance: {
    color: T.textSecondary,
    fontSize: 14,
    fontFamily: BrandFonts.regular,
  },
  trendingDot: {
    color: T.textSecondary,
    fontSize: 14,
  },
  trendingRating: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: BrandFonts.bold,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
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
    backgroundColor: T.surfaceElevated,
    borderWidth: 1,
    borderColor: T.border,
    position: 'relative',
    ...BrandShadow.card,
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
    backgroundColor: 'rgba(0,0,0,0.12)',
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
    color: T.text,
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
    color: T.textSecondary,
    fontSize: 12,
    fontFamily: BrandFonts.semiBold,
  },
  gemDistance: {
    color: T.textSecondary,
    fontSize: 12,
    fontFamily: BrandFonts.regular,
  },
  gemRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gemRating: {
    color: T.text,
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
    backgroundColor: T.coral,
    shadowColor: T.coral,
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
    color: T.onCoral,
    fontSize: 16,
    fontFamily: BrandFonts.bold,
  },
});
