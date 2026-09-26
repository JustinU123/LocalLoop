export type BusinessReviewRating = 1 | 2 | 3 | 4 | 5;

export type StarRatingDistribution = Record<BusinessReviewRating, number>;

export type BusinessReviewSummary = {
  averageRating: number;
  reviewCount: number;
  distribution: StarRatingDistribution;
};

export type BusinessReviewRow = {
  id: string;
  business_id: string;
  author_user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicBusinessReview = {
  id: string;
  businessId: string;
  authorUserId: string;
  authorDisplayName: string;
  rating: BusinessReviewRating;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type MyBusinessReview = PublicBusinessReview | null;
