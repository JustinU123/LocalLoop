import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatProfileRatingDisplay } from '@/utils/public-profile-stats';

type PublicProfileReviewsPlaceholderProps = {
  rating: number;
  reviewCount: number;
};

/** Phase 1 placeholder until Supabase reviews (Phase 2). */
export function PublicProfileReviewsPlaceholder({
  rating,
  reviewCount,
}: PublicProfileReviewsPlaceholderProps) {
  const styles = useThemedStyles(createStyles);
  const isEmpty = reviewCount === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.rating}>{formatProfileRatingDisplay(rating)}</Text>
      <Text style={styles.count}>
        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
      </Text>
      {isEmpty ? (
        <>
          <Text style={styles.headline}>Be the first to review!</Text>
          <Text style={styles.message}>
            Reviews are not available for this preview business profile.
          </Text>
        </>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      marginBottom: 12,
      alignItems: 'center',
      ...theme.shadowCard,
    },
    rating: {
      color: theme.text,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
    },
    count: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
      marginTop: 4,
    },
    headline: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      marginTop: 16,
      textAlign: 'center',
    },
    message: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      marginTop: 8,
      textAlign: 'center',
    },
  });
}
