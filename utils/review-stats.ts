import type {
  BusinessReviewRating,
  BusinessReviewSummary,
  StarRatingDistribution,
} from '@/types/supabase-review';

export const EMPTY_RATING_DISTRIBUTION: StarRatingDistribution = {
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  1: 0,
};

export function createEmptyReviewSummary(): BusinessReviewSummary {
  return {
    averageRating: 0,
    reviewCount: 0,
    distribution: { ...EMPTY_RATING_DISTRIBUTION },
  };
}

export function isWholeStarRating(value: number): value is BusinessReviewRating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function buildReviewSummaryFromRatings(ratings: number[]): BusinessReviewSummary {
  const distribution: StarRatingDistribution = { ...EMPTY_RATING_DISTRIBUTION };

  for (const rating of ratings) {
    if (!isWholeStarRating(rating)) {
      continue;
    }
    distribution[rating] += 1;
  }

  const reviewCount = ratings.length;
  if (reviewCount === 0) {
    return createEmptyReviewSummary();
  }

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  const averageRating = sum / reviewCount;

  return {
    averageRating,
    reviewCount,
    distribution,
  };
}

export function getDistributionPercent(count: number, total: number): number {
  if (total <= 0 || count <= 0) {
    return 0;
  }
  return (count / total) * 100;
}
