import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import {
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
import {
  DEFAULT_RADIUS,
  FOLLOWING_PROMOTIONS,
  NEARBY_PROMOTIONS,
  type Promotion,
  type RadiusOption,
} from '@/data/promotions';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type PromotionsSegment = 'following' | 'nearby';

const SEGMENT_OPTIONS: { id: PromotionsSegment; label: string }[] = [
  { id: 'following', label: 'Following' },
  { id: 'nearby', label: 'Nearby' },
];

export default function PromotionsScreen() {
  const styles = useThemedStyles(createStyles);
  const [segment, setSegment] = useState<PromotionsSegment>('following');
  const [selectedRadius, setSelectedRadius] = useState<RadiusOption>(DEFAULT_RADIUS);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const promotions = useMemo(() => {
    if (segment === 'following') {
      return FOLLOWING_PROMOTIONS;
    }

    return NEARBY_PROMOTIONS.filter((promotion) => promotion.distanceMiles <= selectedRadius);
  }, [segment, selectedRadius]);

  const toggleSave = useCallback((id: string) => {
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
  }, []);

  const handleViewBusiness = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const renderPromotion: ListRenderItem<Promotion> = useCallback(
    ({ item }) => (
      <PromotionCard
        promotion={item}
        saved={savedIds.has(item.id)}
        onToggleSave={() => toggleSave(item.id)}
        onViewBusiness={handleViewBusiness}
      />
    ),
    [handleViewBusiness, savedIds, toggleSave],
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
          <RadiusSelector selectedRadius={selectedRadius} onSelect={setSelectedRadius} />
        </View>
      ) : null}
    </View>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No promotions in this radius</Text>
      <Text style={styles.emptyText}>Try expanding your search radius to discover more nearby deals.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id}
        renderItem={renderPromotion}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={segment === 'nearby' ? listEmpty : null}
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
