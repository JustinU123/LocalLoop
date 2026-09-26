import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { PromotionCard } from '@/components/promotions/promotion-card';
import { RadiusSelector } from '@/components/promotions/radius-selector';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useLocationSettings } from '@/contexts/location-settings-context';
import { useSavedItems } from '@/contexts/saved-items-context';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { listFollowedBusinessIdsForCurrentUser } from '@/services/businessFollows';
import { getActivePromotionFeed } from '@/services/promotions';
import type { PromotionFeedItem } from '@/types/promotion-feed';
import { openBusinessProfile } from '@/utils/open-business-profile';

type PromotionsSegment = 'following' | 'nearby';

const SEGMENT_OPTIONS: { id: PromotionsSegment; label: string }[] = [
  { id: 'following', label: 'Following' },
  { id: 'nearby', label: 'Nearby' },
];

export default function PromotionsScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const { searchRadius, setSearchRadius, coordinates } = useLocationSettings();
  const [segment, setSegment] = useState<PromotionsSegment>('nearby');
  const { isPromotionSaved, togglePromotionSaved } = useSavedItems();
  const [allPromotions, setAllPromotions] = useState<PromotionFeedItem[]>([]);
  const [followedBusinessIds, setFollowedBusinessIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const [feedResult, followsResult] = await Promise.all([
      getActivePromotionFeed({ origin: coordinates }),
      listFollowedBusinessIdsForCurrentUser(),
    ]);

    if (!feedResult.ok) {
      setAllPromotions([]);
      setLoadError(feedResult.message);
      setLoading(false);
      return;
    }

    setAllPromotions(feedResult.promotions);
    if (followsResult.ok) {
      setFollowedBusinessIds(followsResult.businessIds);
    } else {
      setFollowedBusinessIds([]);
    }
    setLoading(false);
  }, [coordinates]);

  useFocusEffect(
    useCallback(() => {
      void loadPromotions();
    }, [loadPromotions]),
  );

  const promotions = useMemo(() => {
    if (segment === 'following') {
      const allowed = new Set(followedBusinessIds);
      return allPromotions.filter((promotion) => allowed.has(promotion.businessId));
    }

    return allPromotions.filter((promotion) => promotion.distanceMiles <= searchRadius);
  }, [allPromotions, followedBusinessIds, segment, searchRadius]);

  const handleViewBusiness = useCallback((businessId: string) => {
    openBusinessProfile(businessId, { source: 'promotions-tab' });
  }, []);

  const renderPromotion: ListRenderItem<PromotionFeedItem> = useCallback(
    ({ item }) => (
      <PromotionCard
        promotion={item}
        saved={isPromotionSaved(item.id)}
        onToggleSave={() => togglePromotionSaved(item)}
        onViewBusiness={() => handleViewBusiness(item.businessId)}
      />
    ),
    [handleViewBusiness, isPromotionSaved, togglePromotionSaved],
  );

  const listHeader = (
    <View style={styles.listHeader}>
      <LocalLoopWordmark style={styles.headerWordmark} />
      <Text style={styles.title}>Promotions</Text>
      <SegmentedControl
        options={SEGMENT_OPTIONS}
        selectedId={segment}
        onSelect={setSegment}
      />
      {segment === 'nearby' ? (
        <View style={styles.radiusSection}>
          <Text style={styles.radiusLabel}>Search radius</Text>
          <RadiusSelector selectedRadius={searchRadius} onSelect={setSearchRadius} />
        </View>
      ) : null}
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.emerald} />
          <Text style={styles.loadingText}>Loading active promotions…</Text>
        </View>
      ) : null}
      {loadError ? (
        <Text style={styles.errorText}>{loadError}</Text>
      ) : null}
    </View>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>
        {segment === 'following' ? 'No active promotions from businesses you follow' : 'No promotions in this radius'}
      </Text>
      <Text style={styles.emptyText}>
        {segment === 'following'
          ? 'Follow verified local businesses to see their live promotions here.'
          : 'Try expanding your search radius to discover more nearby deals.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={loading ? [] : promotions}
        keyExtractor={(item) => item.id}
        renderItem={renderPromotion}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={!loading ? listEmpty : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    listHeader: {
      paddingTop: 4,
      paddingBottom: 20,
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
    radiusSection: {
      gap: 10,
    },
    radiusLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 0.2,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    errorText: {
      color: theme.coral,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    separator: {
      height: 16,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 24,
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
  });
}
