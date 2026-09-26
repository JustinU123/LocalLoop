import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingDistribution } from '@/components/business/reviews/rating-distribution';
import { ReviewCard } from '@/components/business/reviews/review-card';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { Business } from '@/data/businesses';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessReviewSummary, PublicBusinessReview } from '@/types/supabase-review';
import { getBusinessInitials } from '@/utils/business-initials';
import { formatProfileRatingDisplay } from '@/utils/public-profile-stats';

type PublicProfileReviewsPanelProps = {
  business: Business;
  summary: BusinessReviewSummary;
  reviews: PublicBusinessReview[];
  currentUserId: string | null;
  isBusinessOwner: boolean;
  hasOwnReview: boolean;
  onLeaveReview: () => void;
  onEditReview: () => void;
  onDeleteReview: (reviewId: string) => void;
};

export function PublicProfileReviewsPanel({
  business,
  summary,
  reviews,
  currentUserId,
  isBusinessOwner,
  hasOwnReview,
  onLeaveReview,
  onEditReview,
  onDeleteReview,
}: PublicProfileReviewsPanelProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const isEmpty = summary.reviewCount === 0;
  const showLeaveReviewCta = !isBusinessOwner;

  return (
    <View style={styles.container}>
      <View style={styles.miniHeader}>
        {business.logo ? (
          <Image source={{ uri: business.logo }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{getBusinessInitials(business.name)}</Text>
          </View>
        )}
        <View style={styles.miniHeaderText}>
          <Text style={styles.businessName} numberOfLines={2}>
            {business.name}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {business.category}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryLeft}>
          <Text style={styles.averageRating}>{formatProfileRatingDisplay(summary.averageRating)}</Text>
          <Text style={styles.reviewCountLabel}>
            {summary.reviewCount} {summary.reviewCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
        <RatingDistribution distribution={summary.distribution} reviewCount={summary.reviewCount} />
      </View>

      {isEmpty ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyHeadline}>Be the first to review!</Text>
        </View>
      ) : null}

      {showLeaveReviewCta ? (
        <Pressable
          onPress={onLeaveReview}
          style={({ pressed }) => [styles.leaveReviewButton, pressed && styles.leaveReviewPressed]}>
          <Ionicons name="create-outline" size={18} color={theme.onEmerald} />
          <Text style={styles.leaveReviewText}>{hasOwnReview ? 'Edit your review' : 'Leave a review'}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.allReviewsTitle}>All Reviews</Text>

      {reviews.length === 0 ? (
        <Text style={styles.noReviewsYet}>No written reviews yet.</Text>
      ) : (
        reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            canManage={currentUserId != null && review.authorUserId === currentUserId}
            onEdit={onEditReview}
            onDelete={() => onDeleteReview(review.id)}
          />
        ))
      )}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    miniHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFallbackText: {
      color: theme.emerald,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
    },
    miniHeaderText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    businessName: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    category: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 16,
    },
    summaryLeft: {
      alignItems: 'center',
      minWidth: 88,
    },
    averageRating: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.5,
    },
    reviewCountLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      marginTop: 4,
      textAlign: 'center',
    },
    emptyBlock: {
      marginBottom: 12,
    },
    emptyHeadline: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'center',
    },
    leaveReviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingVertical: 14,
      paddingHorizontal: 18,
      marginBottom: 18,
      ...theme.shadowButton,
    },
    leaveReviewPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    leaveReviewText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    allReviewsTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      marginBottom: 12,
    },
    noReviewsYet: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
      marginBottom: 12,
    },
  });
}
