import { supabase } from '@/lib/supabase';
import type {
  BusinessReviewRating,
  BusinessReviewSummary,
  MyBusinessReview,
  PublicBusinessReview,
} from '@/types/supabase-review';
import { getCurrentSession } from '@/utils/auth';
import {
  buildReviewSummaryFromRatings,
  createEmptyReviewSummary,
  isWholeStarRating,
} from '@/utils/review-stats';
import { formatRelativePostTime } from '@/services/explorePosts';

export type BusinessReviewsErrorCode =
  | 'not_found'
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid_rating'
  | 'network'
  | 'unexpected';

export type GetBusinessReviewsResult =
  | {
      ok: true;
      summary: BusinessReviewSummary;
      reviews: PublicBusinessReview[];
      myReview: MyBusinessReview;
    }
  | { ok: false; code: BusinessReviewsErrorCode; message: string };

export type UpsertBusinessReviewResult =
  | { ok: true; review: PublicBusinessReview }
  | { ok: false; code: BusinessReviewsErrorCode; message: string };

export type DeleteBusinessReviewResult =
  | { ok: true }
  | { ok: false; code: BusinessReviewsErrorCode; message: string };

const REVIEW_SELECT =
  'id, business_id, author_user_id, rating, body, created_at, updated_at, profiles:author_user_id(display_name)';

type ReviewDbRow = {
  id: string;
  business_id: string;
  author_user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

function resolveProfileDisplayName(
  profiles: ReviewDbRow['profiles'],
): string | null {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0]?.display_name ?? null;
  }

  return profiles.display_name;
}

function logDevError(scope: string, error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error(`[businessReviews:${scope}]`, context ?? {}, error);
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  return /network request failed|failed to fetch|network error/i.test(message);
}

function formatAuthorName(displayName: string | null | undefined, userId: string): string {
  const trimmed = displayName?.trim();
  if (trimmed) {
    return trimmed;
  }
  return `Member ${userId.slice(0, 6)}`;
}

function mapRowToPublicReview(row: ReviewDbRow): PublicBusinessReview {
  const rating = isWholeStarRating(row.rating) ? row.rating : 1;

  return {
    id: row.id,
    businessId: row.business_id,
    authorUserId: row.author_user_id,
    authorDisplayName: formatAuthorName(resolveProfileDisplayName(row.profiles), row.author_user_id),
    rating,
    body: row.body?.trim() ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildSummary(reviews: PublicBusinessReview[]): BusinessReviewSummary {
  if (reviews.length === 0) {
    return createEmptyReviewSummary();
  }

  return buildReviewSummaryFromRatings(reviews.map((review) => review.rating));
}

export async function getBusinessReviewsBundle(
  businessId: string,
): Promise<GetBusinessReviewsResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: 'Business not found.' };
  }

  try {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id ?? null;

    const { data, error } = await supabase
      .from('business_reviews')
      .select(REVIEW_SELECT)
      .eq('business_id', trimmedId)
      .order('created_at', { ascending: false });

    if (error) {
      logDevError('getBusinessReviewsBundle', error, { businessId: trimmedId });
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load reviews right now.',
      };
    }

    const rows = (data as unknown as ReviewDbRow[] | null) ?? [];
    const reviews = rows.map(mapRowToPublicReview);
    const summary = buildSummary(reviews);
    const myReview =
      currentUserId != null
        ? reviews.find((review) => review.authorUserId === currentUserId) ?? null
        : null;

    return { ok: true, summary, reviews, myReview };
  } catch (error) {
    logDevError('getBusinessReviewsBundle', error, { businessId: trimmedId });
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load reviews right now.',
    };
  }
}

export async function upsertBusinessReview(input: {
  businessId: string;
  rating: BusinessReviewRating;
  body?: string;
}): Promise<UpsertBusinessReviewResult> {
  const trimmedId = input.businessId.trim();
  const body = input.body?.trim() ?? '';

  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: 'Business not found.' };
  }

  if (!isWholeStarRating(input.rating)) {
    return { ok: false, code: 'invalid_rating', message: 'Choose a rating from 1 to 5 stars.' };
  }

  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    if (!userId) {
      return { ok: false, code: 'unauthenticated', message: 'Sign in to leave a review.' };
    }

    const { data: ownerRow, error: ownerError } = await supabase
      .from('businesses')
      .select('owner_user_id')
      .eq('id', trimmedId)
      .maybeSingle();

    if (ownerError) {
      logDevError('upsertBusinessReview.ownerLookup', ownerError, { businessId: trimmedId });
      return {
        ok: false,
        code: isNetworkError(ownerError) ? 'network' : 'unexpected',
        message: 'Unable to save your review right now.',
      };
    }

    if (ownerRow?.owner_user_id === userId) {
      return {
        ok: false,
        code: 'forbidden',
        message: 'Business owners cannot review their own business.',
      };
    }

    const { data, error } = await supabase
      .from('business_reviews')
      .upsert(
        {
          business_id: trimmedId,
          author_user_id: userId,
          rating: input.rating,
          body: body.length > 0 ? body : null,
        },
        { onConflict: 'business_id,author_user_id' },
      )
      .select(REVIEW_SELECT)
      .single();

    if (error) {
      logDevError('upsertBusinessReview', error, { businessId: trimmedId });
      const code = error.code === '42501' ? 'forbidden' : isNetworkError(error) ? 'network' : 'unexpected';
      return {
        ok: false,
        code,
        message:
          code === 'forbidden'
            ? 'You cannot leave a review for this business.'
            : 'Unable to save your review right now.',
      };
    }

    return { ok: true, review: mapRowToPublicReview(data as unknown as ReviewDbRow) };
  } catch (error) {
    logDevError('upsertBusinessReview', error, { businessId: trimmedId });
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to save your review right now.',
    };
  }
}

export async function deleteBusinessReview(reviewId: string): Promise<DeleteBusinessReviewResult> {
  const trimmedId = reviewId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: 'Review not found.' };
  }

  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return { ok: false, code: 'unauthenticated', message: 'Sign in to manage your review.' };
    }

    const { error } = await supabase.from('business_reviews').delete().eq('id', trimmedId);

    if (error) {
      logDevError('deleteBusinessReview', error, { reviewId: trimmedId });
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to delete your review right now.',
      };
    }

    return { ok: true };
  } catch (error) {
    logDevError('deleteBusinessReview', error, { reviewId: trimmedId });
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to delete your review right now.',
    };
  }
}

export function formatReviewDate(isoDate: string): string {
  return formatRelativePostTime(isoDate);
}
