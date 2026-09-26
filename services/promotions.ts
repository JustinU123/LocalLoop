import { supabase } from '@/lib/supabase';
import { getCurrentVerifiedBusiness } from '@/services/posts';
import {
  deleteUploadedPromotionImage,
  extractPromotionImageStoragePath,
  uploadPromotionImage,
} from '@/services/promotionStorage';
import {
  getOwnerPromotionLifecycle,
  type OwnerPromotionLifecycle,
} from '@/utils/promotion-owner';
import type { BusinessPromotionItem } from '@/data/businesses';
import type { PromotionFeedItem } from '@/types/promotion-feed';
import type { PromotionDraft } from '@/types/promotion-draft';
import type { BusinessPromotion, PromotionRow } from '@/types/supabase-promotion';
import type { MapCoordinate } from '@/utils/map-filters';
import { resolveBusinessLogoUrl } from '@/utils/business-branding-display';
import { formatMapDistance, getDistanceMiles } from '@/utils/map-filters';
import {
  formatPromotionExpiresLabel,
  formatPromotionScheduleFromIso,
} from '@/utils/promotion-display';
import { serializeIsoDate, serializeTimeValue } from '@/utils/date-time';
import {
  getPromotionEndDateTime,
  getPromotionStartDateTime,
  validatePromotionForm,
} from '@/utils/promotion-form';

export type PromotionErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'invalid_promotion'
  | 'network'
  | 'upload_failed'
  | 'insert_failed'
  | 'update_failed'
  | 'delete_failed'
  | 'archive_failed'
  | 'not_found'
  | 'unexpected';

export type PublishPromotionResult =
  | { ok: true; promotion: BusinessPromotion }
  | { ok: false; code: PromotionErrorCode; message: string };

export type OwnerManagedPromotion = BusinessPromotion & {
  lifecycle: OwnerPromotionLifecycle;
};

export type ListOwnerPromotionsResult =
  | { ok: true; promotions: OwnerManagedPromotion[] }
  | { ok: false; code: PromotionErrorCode; message: string };

export type GetOwnerPromotionResult =
  | { ok: true; promotion: OwnerManagedPromotion }
  | { ok: false; code: PromotionErrorCode; message: string };

export type MutateOwnerPromotionResult =
  | { ok: true; promotion?: BusinessPromotion }
  | { ok: false; code: PromotionErrorCode; message: string };

const PROMOTION_SELECT =
  'id, business_id, status, title, description, image_url, start_at, end_at, promotion_code, redemption_instructions, terms_and_conditions, created_at, updated_at';

const PROMOTION_WITH_BUSINESS_SELECT = `${PROMOTION_SELECT}, businesses!inner ( id, name, latitude, longitude, verification_status, logo_url, cover_image_url )`;

type PromotionBusinessJoin = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  logo_url: string | null;
  cover_image_url: string | null;
};

type PromotionRowWithBusiness = PromotionRow & {
  businesses: PromotionBusinessJoin;
};

function normalizePromotionBusinessJoin(
  value: PromotionBusinessJoin | PromotionBusinessJoin[] | null | undefined,
): PromotionBusinessJoin | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

function normalizePromotionRowsWithBusiness(
  data: unknown,
): PromotionRowWithBusiness[] {
  const rows = (data as (PromotionRow & { businesses: unknown })[] | null) ?? [];
  const normalized: PromotionRowWithBusiness[] = [];

  for (const row of rows) {
    const business = normalizePromotionBusinessJoin(
      row.businesses as PromotionBusinessJoin | PromotionBusinessJoin[] | null,
    );
    if (!business) {
      continue;
    }
    normalized.push({ ...row, businesses: business });
  }

  return normalized;
}

export type PromotionReadErrorCode = 'network' | 'unexpected';

export type GetActivePromotionBusinessIdsResult =
  | { ok: true; businessIds: Set<string> }
  | { ok: false; code: PromotionReadErrorCode; message: string };

export type GetActivePromotionsForBusinessResult =
  | { ok: true; promotions: BusinessPromotionItem[] }
  | { ok: false; code: PromotionReadErrorCode; message: string };

export type GetOwnerScheduledPromotionsForBusinessResult =
  | { ok: true; promotions: BusinessPromotionItem[] }
  | { ok: false; code: PromotionReadErrorCode; message: string };

export type GetActivePromotionFeedResult =
  | { ok: true; promotions: PromotionFeedItem[] }
  | { ok: false; code: PromotionReadErrorCode; message: string };

/** Consumer eligibility window (matches public RLS intent). */
export function consumerActivePromotionNowIso(now = new Date()): string {
  return now.toISOString();
}

function isConsumerActivePromotionRow(row: PromotionRow, nowIso: string): boolean {
  return row.status === 'published' && row.start_at <= nowIso && row.end_at >= nowIso;
}

export function mergeOwnerProfilePromotions(
  active: BusinessPromotionItem[],
  scheduled: BusinessPromotionItem[],
): BusinessPromotionItem[] {
  const activeIds = new Set(active.map((promotion) => promotion.id));
  const upcoming = scheduled
    .filter((promotion) => !activeIds.has(promotion.id))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  return [...active, ...upcoming];
}

function mapRowToOwnerScheduledPromotionItem(
  row: PromotionRow,
  now = new Date(),
): BusinessPromotionItem | null {
  if (getOwnerPromotionLifecycle(row, now) !== 'scheduled') {
    return null;
  }
  return {
    ...mapRowToBusinessPromotionItem(row, now),
    ownerPreviewScheduled: true,
  };
}

function mapRowToBusinessPromotionItem(row: PromotionRow, now = new Date()): BusinessPromotionItem {
  const code = row.promotion_code?.trim();
  const redemption = row.redemption_instructions?.trim();
  const terms = row.terms_and_conditions?.trim();

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    expiresLabel: formatPromotionExpiresLabel(row.end_at, now),
    scheduleLabel: formatPromotionScheduleFromIso(row.start_at, row.end_at),
    image: row.image_url?.trim() ?? '',
    startAt: row.start_at,
    endAt: row.end_at,
    ...(code ? { promotionCode: code } : {}),
    ...(redemption ? { redemptionInstructions: redemption } : {}),
    ...(terms ? { termsAndConditions: terms } : {}),
  };
}

async function fetchBusinessCoverImages(businessIds: string[]): Promise<Map<string, string>> {
  if (businessIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('posts')
    .select('business_id, image_url, created_at')
    .eq('status', 'published')
    .not('image_url', 'is', null)
    .in('business_id', businessIds)
    .order('created_at', { ascending: false });

  if (error) {
    logDevError('fetchBusinessCoverImages', error);
    return new Map();
  }

  const latestImageByBusiness = new Map<string, string>();
  for (const post of data ?? []) {
    const businessId = post.business_id as string;
    const imageUrl = post.image_url as string | null;
    if (!imageUrl || latestImageByBusiness.has(businessId)) {
      continue;
    }
    latestImageByBusiness.set(businessId, imageUrl);
  }

  return latestImageByBusiness;
}

function mapRowToFeedItem(
  row: PromotionRowWithBusiness,
  origin: MapCoordinate | null,
  coverImages: Map<string, string>,
  now = new Date(),
): PromotionFeedItem | null {
  const business = row.businesses;
  if (business.verification_status !== 'verified') {
    return null;
  }

  const latitude = business.latitude;
  const longitude = business.longitude;
  let distanceMiles = 0;
  let distanceLabel = '';

  if (
    origin &&
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    distanceMiles = getDistanceMiles(origin, { latitude, longitude });
    distanceLabel = `${formatMapDistance(distanceMiles)} away`;
  }

  const legacyPostImage = coverImages.get(business.id) ?? null;
  const promotionImage = row.image_url?.trim() || legacyPostImage || '';
  const businessLogo = resolveBusinessLogoUrl({
    logoUrl: business.logo_url,
    legacyFallback: legacyPostImage,
  });

  const code = row.promotion_code?.trim();
  const redemption = row.redemption_instructions?.trim();
  const terms = row.terms_and_conditions?.trim();

  return {
    id: row.id,
    businessId: business.id,
    businessName: business.name,
    businessLogo,
    promotionImage,
    title: row.title,
    description: row.description,
    distanceLabel,
    distanceMiles,
    scheduleLabel: formatPromotionScheduleFromIso(row.start_at, row.end_at),
    expiresLabel: formatPromotionExpiresLabel(row.end_at, now),
    verified: true,
    startAt: row.start_at,
    endAt: row.end_at,
    ...(code ? { promotionCode: code } : {}),
    ...(redemption ? { redemptionInstructions: redemption } : {}),
    ...(terms ? { termsAndConditions: terms } : {}),
  };
}

async function queryActivePromotionsWithBusiness(
  nowIso: string,
  businessId?: string,
): Promise<{ ok: true; rows: PromotionRowWithBusiness[] } | { ok: false; error: unknown }> {
  let query = supabase
    .from('promotions')
    .select(PROMOTION_WITH_BUSINESS_SELECT)
    .eq('status', 'published')
    .lte('start_at', nowIso)
    .gte('end_at', nowIso)
    .eq('businesses.verification_status', 'verified');

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  const { data, error } = await query.order('end_at', { ascending: true });

  if (error) {
    return { ok: false, error };
  }

  const rows = normalizePromotionRowsWithBusiness(data);
  return {
    ok: true,
    rows: rows.filter((row) => isConsumerActivePromotionRow(row, nowIso)),
  };
}

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[promotions:${scope}]`, error);
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

function userFacingError(code: PromotionErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to publish.';
    case 'not_verified':
      return 'Your business must be verified before publishing promotions.';
    case 'invalid_promotion':
      return 'Complete all required promotion fields before publishing.';
    case 'network':
      return 'Check your connection and try again.';
    case 'upload_failed':
      return "We couldn't upload your promotion image. Please try again.";
    case 'insert_failed':
      return "We couldn't publish your promotion. Please try again.";
    case 'update_failed':
      return "We couldn't save your promotion changes. Please try again.";
    case 'delete_failed':
      return "We couldn't delete this promotion. Please try again.";
    case 'archive_failed':
      return "We couldn't end this promotion. Please try again.";
    case 'not_found':
      return 'This promotion could not be found.';
    default:
      return "We couldn't publish your promotion. Please try again.";
  }
}

async function requireVerifiedOwnerBusiness(): Promise<
  | { ok: true; businessId: string; userId: string }
  | { ok: false; code: PromotionErrorCode; message: string }
> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    const code: PromotionErrorCode =
      verified.code === 'unauthenticated' ||
      verified.code === 'not_verified' ||
      verified.code === 'network'
        ? verified.code
        : 'unexpected';
    return {
      ok: false,
      code,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code)
          : verified.message,
    };
  }

  return { ok: true, businessId: verified.business.id, userId: verified.userId };
}

function mapRowToOwnerManagedPromotion(row: PromotionRow, now = new Date()): OwnerManagedPromotion {
  const promotion = promotionRowToBusinessPromotion(row);
  return {
    ...promotion,
    lifecycle: getOwnerPromotionLifecycle(row, now),
  };
}

function buildUpdatePayload(
  draft: PromotionDraft,
  imageUrl: string | null,
): Record<string, unknown> | null {
  const startDateTime = getPromotionStartDateTime(draft);
  const endDateTime = getPromotionEndDateTime(draft);

  if (!startDateTime || !endDateTime) {
    return null;
  }

  if (endDateTime.getTime() < startDateTime.getTime()) {
    return null;
  }

  const code = draft.promotionCode.trim();
  const redemption = draft.redemptionInstructions.trim();
  const terms = draft.termsAndConditions.trim();

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    image_url: imageUrl,
    start_at: startDateTime.toISOString(),
    end_at: endDateTime.toISOString(),
    promotion_code: code ? code : null,
    redemption_instructions: redemption ? redemption : null,
    terms_and_conditions: terms ? terms : null,
  };
}

async function resolvePromotionImageForSave(params: {
  draft: PromotionDraft;
  businessId: string;
  userId: string;
  previousImageUrl: string | null;
}): Promise<
  | { ok: true; imageUrl: string | null; uploadedPath: string | null; previousPathToDelete: string | null }
  | { ok: false; code: PromotionErrorCode; message: string }
> {
  const imageUri = params.draft.imageUri?.trim() ?? '';
  const previousPath = extractPromotionImageStoragePath(params.previousImageUrl);

  if (!imageUri) {
    return {
      ok: true,
      imageUrl: null,
      uploadedPath: null,
      previousPathToDelete: previousPath,
    };
  }

  if (isLocalImageUri(imageUri)) {
    const uploadResult = await uploadPromotionImage({
      businessId: params.businessId,
      userId: params.userId,
      uri: imageUri,
    });

    if (!uploadResult.ok) {
      return {
        ok: false,
        code: 'upload_failed',
        message: uploadResult.message,
      };
    }

    return {
      ok: true,
      imageUrl: uploadResult.publicUrl,
      uploadedPath: uploadResult.path,
      previousPathToDelete: previousPath,
    };
  }

  const unchangedRemote = params.previousImageUrl?.trim() === imageUri;
  return {
    ok: true,
    imageUrl: imageUri,
    uploadedPath: null,
    previousPathToDelete: unchangedRemote ? null : previousPath,
  };
}

function isLocalImageUri(uri: string): boolean {
  const trimmed = uri.trim();
  return (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('ph://') ||
    trimmed.startsWith('assets-library:')
  );
}

function promotionRowToDraft(row: PromotionRow): PromotionDraft {
  const startAt = new Date(row.start_at);
  const endAt = new Date(row.end_at);

  return {
    imageUri: row.image_url,
    title: row.title,
    description: row.description,
    startDate: Number.isNaN(startAt.getTime()) ? null : serializeIsoDate(startAt),
    startTime: Number.isNaN(startAt.getTime()) ? null : serializeTimeValue(startAt),
    endDate: Number.isNaN(endAt.getTime()) ? null : serializeIsoDate(endAt),
    endTime: Number.isNaN(endAt.getTime()) ? null : serializeTimeValue(endAt),
    promotionCode: row.promotion_code?.trim() ?? '',
    redemptionInstructions: row.redemption_instructions?.trim() ?? '',
    termsAndConditions: row.terms_and_conditions?.trim() ?? '',
  };
}

export function promotionRowToBusinessPromotion(row: PromotionRow): BusinessPromotion {
  return {
    id: row.id,
    businessId: row.business_id,
    status: row.status,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    startAt: row.start_at,
    endAt: row.end_at,
    promotionCode: row.promotion_code,
    redemptionInstructions: row.redemption_instructions,
    termsAndConditions: row.terms_and_conditions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    draft: promotionRowToDraft(row),
  };
}

function buildInsertPayload(
  draft: PromotionDraft,
  businessId: string,
  imageUrl: string | null,
): Record<string, unknown> | null {
  const startDateTime = getPromotionStartDateTime(draft);
  const endDateTime = getPromotionEndDateTime(draft);

  if (!startDateTime || !endDateTime) {
    return null;
  }

  if (endDateTime.getTime() < startDateTime.getTime()) {
    return null;
  }

  const code = draft.promotionCode.trim();
  const redemption = draft.redemptionInstructions.trim();
  const terms = draft.termsAndConditions.trim();

  return {
    business_id: businessId,
    status: 'published',
    title: draft.title.trim(),
    description: draft.description.trim(),
    image_url: imageUrl,
    start_at: startDateTime.toISOString(),
    end_at: endDateTime.toISOString(),
    promotion_code: code ? code : null,
    redemption_instructions: redemption ? redemption : null,
    terms_and_conditions: terms ? terms : null,
  };
}

export async function publishPromotion(draft: PromotionDraft): Promise<PublishPromotionResult> {
  const { valid } = validatePromotionForm(draft);
  if (!valid) {
    return {
      ok: false,
      code: 'invalid_promotion',
      message: userFacingError('invalid_promotion'),
    };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    const code: PromotionErrorCode =
      verified.code === 'unauthenticated' ||
      verified.code === 'not_verified' ||
      verified.code === 'network'
        ? verified.code
        : 'unexpected';
    return {
      ok: false,
      code,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code)
          : verified.message,
    };
  }

  const { business, userId } = verified;
  const payload = buildInsertPayload(draft, business.id, null);

  if (!payload) {
    return {
      ok: false,
      code: 'invalid_promotion',
      message: userFacingError('invalid_promotion'),
    };
  }

  let uploadedPath: string | null = null;
  let imageUrl: string | null = null;

  const imageUri = draft.imageUri?.trim();
  if (imageUri) {
    if (isLocalImageUri(imageUri)) {
      const uploadResult = await uploadPromotionImage({
        businessId: business.id,
        userId,
        uri: imageUri,
      });

      if (!uploadResult.ok) {
        return {
          ok: false,
          code: 'upload_failed',
          message: uploadResult.message,
        };
      }

      uploadedPath = uploadResult.path;
      imageUrl = uploadResult.publicUrl;
    } else {
      imageUrl = imageUri;
    }
  }

  payload.image_url = imageUrl;

  try {
    const { data, error } = await supabase
      .from('promotions')
      .insert(payload)
      .select(PROMOTION_SELECT)
      .single();

    if (error) {
      logDevError('publishPromotion.insert', error);
      if (uploadedPath) {
        await deleteUploadedPromotionImage(uploadedPath);
      }
      const code: PromotionErrorCode = isNetworkError(error) ? 'network' : 'insert_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const promotion = promotionRowToBusinessPromotion(data as PromotionRow);

    return { ok: true, promotion };
  } catch (error) {
    logDevError('publishPromotion', error);
    if (uploadedPath) {
      await deleteUploadedPromotionImage(uploadedPath);
    }
    const code = isNetworkError(error) ? 'network' : 'insert_failed';
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }
}

export async function getActivePromotionBusinessIds(
  now = new Date(),
): Promise<GetActivePromotionBusinessIdsResult> {
  const nowIso = consumerActivePromotionNowIso(now);

  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('business_id')
      .eq('status', 'published')
      .lte('start_at', nowIso)
      .gte('end_at', nowIso);

    if (error) {
      logDevError('getActivePromotionBusinessIds', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load promotion status for the map.',
      };
    }

    const businessIds = new Set<string>();
    for (const row of data ?? []) {
      const id = (row as { business_id?: string }).business_id;
      if (id) {
        businessIds.add(id);
      }
    }

    return { ok: true, businessIds };
  } catch (error) {
    logDevError('getActivePromotionBusinessIds', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load promotion status for the map.',
    };
  }
}

export async function getActivePromotionsForBusiness(
  businessId: string,
  now = new Date(),
): Promise<GetActivePromotionsForBusinessResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: true, promotions: [] };
  }

  const nowIso = consumerActivePromotionNowIso(now);

  try {
    const result = await queryActivePromotionsWithBusiness(nowIso, trimmedId);
    if (!result.ok) {
      logDevError('getActivePromotionsForBusiness', result.error);
      return {
        ok: false,
        code: isNetworkError(result.error) ? 'network' : 'unexpected',
        message: 'Unable to load promotions for this business.',
      };
    }

    const promotions = result.rows.map((row) => mapRowToBusinessPromotionItem(row, now));
    return { ok: true, promotions };
  } catch (error) {
    logDevError('getActivePromotionsForBusiness', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load promotions for this business.',
    };
  }
}

/** Verified owner only; returns empty list when the viewer is not the owner of this business. */
export async function getOwnerScheduledPromotionsForBusiness(
  businessId: string,
  now = new Date(),
): Promise<GetOwnerScheduledPromotionsForBusinessResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: true, promotions: [] };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return { ok: true, promotions: [] };
  }

  if (owner.businessId !== trimmedId) {
    return { ok: true, promotions: [] };
  }

  const nowIso = consumerActivePromotionNowIso(now);

  try {
    const { data, error } = await supabase
      .from('promotions')
      .select(PROMOTION_SELECT)
      .eq('business_id', trimmedId)
      .eq('status', 'published')
      .gt('start_at', nowIso)
      .gte('end_at', nowIso)
      .order('start_at', { ascending: true });

    if (error) {
      logDevError('getOwnerScheduledPromotionsForBusiness', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load scheduled promotions.',
      };
    }

    const promotions = ((data as PromotionRow[] | null) ?? [])
      .map((row) => mapRowToOwnerScheduledPromotionItem(row, now))
      .filter((item): item is BusinessPromotionItem => item !== null);

    return { ok: true, promotions };
  } catch (error) {
    logDevError('getOwnerScheduledPromotionsForBusiness', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load scheduled promotions.',
    };
  }
}

export async function getActivePromotionFeed(params?: {
  origin?: MapCoordinate | null;
  businessIds?: string[];
  now?: Date;
}): Promise<GetActivePromotionFeedResult> {
  const now = params?.now ?? new Date();
  const nowIso = consumerActivePromotionNowIso(now);

  try {
    const result = await queryActivePromotionsWithBusiness(nowIso);
    if (!result.ok) {
      logDevError('getActivePromotionFeed', result.error);
      return {
        ok: false,
        code: isNetworkError(result.error) ? 'network' : 'unexpected',
        message: 'Unable to load promotions right now.',
      };
    }

    let rows = result.rows;
    const filterIds = params?.businessIds;
    if (filterIds && filterIds.length > 0) {
      const allowed = new Set(filterIds);
      rows = rows.filter((row) => allowed.has(row.business_id));
    }

    const businessIds = [...new Set(rows.map((row) => row.business_id))];
    const coverImages = await fetchBusinessCoverImages(businessIds);

    const promotions = rows
      .map((row) => mapRowToFeedItem(row, params?.origin ?? null, coverImages, now))
      .filter((item): item is PromotionFeedItem => item !== null)
      .sort((a, b) => a.distanceMiles - b.distanceMiles || a.endAt.localeCompare(b.endAt));

    return { ok: true, promotions };
  } catch (error) {
    logDevError('getActivePromotionFeed', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load promotions right now.',
    };
  }
}

export async function listOwnerPromotions(now = new Date()): Promise<ListOwnerPromotionsResult> {
  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('promotions')
      .select(PROMOTION_SELECT)
      .eq('business_id', owner.businessId)
      .order('created_at', { ascending: false });

    if (error) {
      logDevError('listOwnerPromotions', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load your promotions.',
      };
    }

    const promotions = ((data as PromotionRow[] | null) ?? []).map((row) =>
      mapRowToOwnerManagedPromotion(row, now),
    );

    return { ok: true, promotions };
  } catch (error) {
    logDevError('listOwnerPromotions', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load your promotions.',
    };
  }
}

export async function getOwnerPromotionById(
  promotionId: string,
  now = new Date(),
): Promise<GetOwnerPromotionResult> {
  const trimmedId = promotionId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('promotions')
      .select(PROMOTION_SELECT)
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .maybeSingle();

    if (error) {
      logDevError('getOwnerPromotionById', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load this promotion.',
      };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    return { ok: true, promotion: mapRowToOwnerManagedPromotion(data as PromotionRow, now) };
  } catch (error) {
    logDevError('getOwnerPromotionById', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load this promotion.',
    };
  }
}

export async function archiveOwnerPromotion(promotionId: string): Promise<MutateOwnerPromotionResult> {
  const trimmedId = promotionId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('promotions')
      .update({ status: 'archived' })
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .select(PROMOTION_SELECT)
      .maybeSingle();

    if (error) {
      logDevError('archiveOwnerPromotion', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'archive_failed',
        message: userFacingError('archive_failed'),
      };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    return { ok: true, promotion: promotionRowToBusinessPromotion(data as PromotionRow) };
  } catch (error) {
    logDevError('archiveOwnerPromotion', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'archive_failed',
      message: userFacingError('archive_failed'),
    };
  }
}

export async function deleteOwnerPromotion(promotionId: string): Promise<MutateOwnerPromotionResult> {
  const trimmedId = promotionId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const existing = await getOwnerPromotionById(trimmedId);
    if (!existing.ok) {
      return existing;
    }

    const imagePath = extractPromotionImageStoragePath(existing.promotion.imageUrl);

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId);

    if (error) {
      logDevError('deleteOwnerPromotion', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'delete_failed',
        message: userFacingError('delete_failed'),
      };
    }

    if (imagePath) {
      await deleteUploadedPromotionImage(imagePath);
    }

    return { ok: true };
  } catch (error) {
    logDevError('deleteOwnerPromotion', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'delete_failed',
      message: userFacingError('delete_failed'),
    };
  }
}

export async function updateOwnerPromotion(
  promotionId: string,
  draft: PromotionDraft,
): Promise<PublishPromotionResult> {
  const trimmedId = promotionId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const { valid } = validatePromotionForm(draft);
  if (!valid) {
    return {
      ok: false,
      code: 'invalid_promotion',
      message: userFacingError('invalid_promotion'),
    };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  const existing = await getOwnerPromotionById(trimmedId);
  if (!existing.ok) {
    return existing;
  }

  if (existing.promotion.lifecycle === 'ended') {
    return {
      ok: false,
      code: 'invalid_promotion',
      message: 'Ended promotions cannot be edited.',
    };
  }

  const imageResolution = await resolvePromotionImageForSave({
    draft,
    businessId: owner.businessId,
    userId: owner.userId,
    previousImageUrl: existing.promotion.imageUrl,
  });

  if (!imageResolution.ok) {
    return imageResolution;
  }

  const payload = buildUpdatePayload(draft, imageResolution.imageUrl);
  if (!payload) {
    return {
      ok: false,
      code: 'invalid_promotion',
      message: userFacingError('invalid_promotion'),
    };
  }

  const { uploadedPath, previousPathToDelete } = imageResolution;

  try {
    const { data, error } = await supabase
      .from('promotions')
      .update(payload)
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .select(PROMOTION_SELECT)
      .single();

    if (error) {
      logDevError('updateOwnerPromotion', error);
      if (uploadedPath) {
        await deleteUploadedPromotionImage(uploadedPath);
      }
      const code: PromotionErrorCode = isNetworkError(error) ? 'network' : 'update_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const promotion = promotionRowToBusinessPromotion(data as PromotionRow);

    const shouldDeletePrevious =
      previousPathToDelete &&
      previousPathToDelete !== uploadedPath &&
      previousPathToDelete !== extractPromotionImageStoragePath(promotion.imageUrl);

    if (shouldDeletePrevious) {
      await deleteUploadedPromotionImage(previousPathToDelete);
    }

    return { ok: true, promotion };
  } catch (error) {
    logDevError('updateOwnerPromotion', error);
    if (uploadedPath) {
      await deleteUploadedPromotionImage(uploadedPath);
    }
    const code = isNetworkError(error) ? 'network' : 'update_failed';
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }
}

/** Re-export for tests / eligibility helpers without duplicating combine logic. */
export function promotionDraftToSchedule(draft: PromotionDraft): {
  startAt: string | null;
  endAt: string | null;
} {
  const start = getPromotionStartDateTime(draft);
  const end = getPromotionEndDateTime(draft);
  return {
    startAt: start ? start.toISOString() : null,
    endAt: end ? end.toISOString() : null,
  };
}
