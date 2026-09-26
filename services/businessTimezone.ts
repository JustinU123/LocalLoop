import { supabase } from '@/lib/supabase';
import { getCurrentUserBusiness } from '@/services/businesses';
import {
  isValidIanaTimezone,
  resolveBusinessTimezoneFromCoordinates,
} from '@/utils/business-timezone';

export type BusinessTimezoneErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'not_found'
  | 'location_required'
  | 'timezone_unavailable'
  | 'network'
  | 'permission'
  | 'update_failed'
  | 'unexpected';

export type EnsureBusinessTimezoneResult =
  | { ok: true; timezone: string; persisted: boolean }
  | { ok: false; code: BusinessTimezoneErrorCode; message: string };

const BUSINESS_TIMEZONE_SELECT =
  'id, owner_user_id, verification_status, latitude, longitude, timezone';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[businessTimezone:${scope}]`, error);
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

function userFacingError(code: BusinessTimezoneErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to manage your business.';
    case 'not_verified':
      return 'Only verified businesses can manage business hours.';
    case 'not_found':
      return 'We could not find your business profile.';
    case 'location_required':
      return 'Add a valid business location before saving hours. Open Business Settings → Location and save your address.';
    case 'timezone_unavailable':
      return 'We could not determine your business timezone from its location. Try saving your location again.';
    case 'network':
      return 'Check your connection and try again.';
    case 'permission':
      return 'You do not have permission to update this business.';
    default:
      return 'We could not update your business timezone. Please try again.';
  }
}

type BusinessTimezoneRow = {
  id: string;
  owner_user_id: string;
  verification_status: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
};

async function requireVerifiedOwnerRow(): Promise<
  | { ok: true; row: BusinessTimezoneRow; userId: string }
  | { ok: false; code: BusinessTimezoneErrorCode; message: string }
> {
  const { business, userId, error: lookupError } = await getCurrentUserBusiness();
  if (lookupError) {
    return {
      ok: false,
      code: lookupError === 'network' ? 'network' : 'unexpected',
      message: userFacingError(lookupError === 'network' ? 'network' : 'unexpected'),
    };
  }

  if (!userId) {
    return {
      ok: false,
      code: 'unauthenticated',
      message: userFacingError('unauthenticated'),
    };
  }

  if (!business) {
    return {
      ok: false,
      code: 'not_found',
      message: userFacingError('not_found'),
    };
  }

  if (business.verification_status !== 'verified') {
    return {
      ok: false,
      code: 'not_verified',
      message: userFacingError('not_verified'),
    };
  }

  const { data, error } = await supabase
    .from('businesses')
    .select(BUSINESS_TIMEZONE_SELECT)
    .eq('id', business.id)
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (error) {
    logDevError('requireVerifiedOwnerRow', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }

  if (!data) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  return { ok: true, row: data as BusinessTimezoneRow, userId };
}

export async function ensureBusinessTimezone(): Promise<EnsureBusinessTimezoneResult> {
  const owner = await requireVerifiedOwnerRow();
  if (!owner.ok) {
    return owner;
  }

  const { row, userId } = owner;

  if (row.latitude === null || row.longitude === null) {
    return {
      ok: false,
      code: 'location_required',
      message: userFacingError('location_required'),
    };
  }

  if (isValidIanaTimezone(row.timezone)) {
    return { ok: true, timezone: row.timezone!.trim(), persisted: false };
  }

  const resolved = await resolveBusinessTimezoneFromCoordinates(row.latitude, row.longitude);
  if (!resolved.ok) {
    return {
      ok: false,
      code: 'timezone_unavailable',
      message: userFacingError('timezone_unavailable'),
    };
  }

  const { error } = await supabase
    .from('businesses')
    .update({ timezone: resolved.timezone })
    .eq('id', row.id)
    .eq('owner_user_id', userId);

  if (error) {
    logDevError('ensureBusinessTimezone.update', error);
    const code: BusinessTimezoneErrorCode =
      error.code === '42501' || /permission denied|row-level security/i.test(error.message)
        ? 'permission'
        : isNetworkError(error)
          ? 'network'
          : 'update_failed';
    return { ok: false, code, message: userFacingError(code) };
  }

  return { ok: true, timezone: resolved.timezone, persisted: true };
}
