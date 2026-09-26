import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessReviewRating, StarRatingDistribution } from '@/types/supabase-review';
import { getDistributionPercent } from '@/utils/review-stats';

const STAR_LEVELS: BusinessReviewRating[] = [5, 4, 3, 2, 1];

type RatingDistributionProps = {
  distribution: StarRatingDistribution;
  reviewCount: number;
};

export function RatingDistribution({ distribution, reviewCount }: RatingDistributionProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {STAR_LEVELS.map((stars) => {
        const count = distribution[stars];
        const widthPercent = getDistributionPercent(count, reviewCount);
        return (
          <View key={stars} style={styles.row}>
            <Text style={styles.starLabel}>{stars}</Text>
            <Ionicons name="star" size={12} color={theme.star} />
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${widthPercent}%` }]} />
            </View>
            <Text style={styles.count}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    starLabel: {
      width: 10,
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'right',
    },
    track: {
      flex: 1,
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.surfaceElevated,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: theme.star,
      minWidth: 0,
    },
    count: {
      width: 22,
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.medium,
      textAlign: 'right',
    },
  });
}
