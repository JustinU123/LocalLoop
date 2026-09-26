import { supabase } from '@/lib/supabase';
import { ensureBusinessTimezone } from '@/services/businessTimezone';
import { getCurrentUserBusiness } from '@/services/businesses';
import { isValidIanaTimezone } from '@/utils/business-timezone';
import type { WeeklyBusinessHours } from '@/types/business-hours';
import {
  normalizeWeeklyBusinessHours,
  validateWeeklyBusinessHours,
  weeklyHoursForDatabase,
} from '@/utils/business-hours';

export type BusinessHoursErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'not_found'
  | 'invalid_hours'
  | 'location_required'
  | 'timezone_unavailable'
  | 'schema_not_ready'
  | 'network'
  | 'permission'
  | 'update_failed'
  | 'unexpected';

export type OwnerBusinessHoursRecord = {
  businessId: string;
  timezone: string | null;
  weeklyHours: WeeklyBusinessHours;
};

export type GetOwnerBusinessHoursResult =
  | { ok: true; hours: OwnerBusinessHoursRecord }
  | { ok: false; code: BusinessHoursErrorCode; message: string };

export type UpdateOwnerBusinessHoursResult =
  | { ok: true; hours: OwnerBusinessHoursRecord }
  | { ok: false; code: BusinessHoursErrorCode; message: string };

const BUSINESS_HOURS_SELECT = 'id, owner_user_id, verification_status, timezone, weekly_hours';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[businessHours:${scope}]`, error);
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

function isSchemaNotReadyError(error: unknown): boolean {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '');

  return /weekly_hours|timezone|column.*does not exist|schema cache/i.test(message);
}

function userFacingError(code: BusinessHoursErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to manage business hours.';
    case 'not_verified':
      return 'Only verified businesses can edit business hours.';
    case 'not_found':
      return 'We could not find your business profile.';
    case 'invalid_hours':
      return 'Fix your weekly schedule before saving.';
    case 'location_required':
      return 'Add a valid business location before saving hours. Open Business Settings → Location and save your address.';
    case 'timezone_unavailable':
      return 'We could not determine your business timezone from its location. Try saving your location again.';
    case 'schema_not_ready':
      return 'Business hours storage is not available yet. Apply the local weekly_hours migration to your Supabase project first.';
    case 'network':
      return 'Check your connection and try again.';
    case 'permission':
      return 'You do not have permission to update business hours.';
    default:
      return 'We could not save your business hours. Please try again.';
  }
}

type BusinessHoursRow = {
  id: string;
  owner_user_id: string;
  verification_status: string;
  timezone: string | null;
  weekly_hours: unknown;
};

function rowToOwnerRecord(row: BusinessHoursRow): OwnerBusinessHoursRecord {
  return {
    businessId: row.id,
    timezone: row.timezone,
    weeklyHours: normalizeWeeklyBusinessHours(row.weekly_hours),
  };
}

async function requireVerifiedOwnerBusiness(): Promise<
  | { ok: true; businessId: string; userId: string }
  | { ok: false; code: BusinessHoursErrorCode; message: string }
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

  return { ok: true, businessId: business.id, userId };
}

export async function getOwnerBusinessHours(): Promise<GetOwnerBusinessHoursResult> {
  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(BUSINESS_HOURS_SELECT)
      .eq('id', owner.businessId)
      .eq('owner_user_id', owner.userId)
      .maybeSingle();

    if (error) {
      logDevError('getOwnerBusinessHours', error);
      if (isSchemaNotReadyError(error)) {
        return {
          ok: false,
          code: 'schema_not_ready',
          message: userFacingError('schema_not_ready'),
        };
      }
      const code: BusinessHoursErrorCode = isNetworkError(error) ? 'network' : 'unexpected';
      return { ok: false, code, message: userFacingError(code) };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    let record = rowToOwnerRecord(data as BusinessHoursRow);

    if (!isValidIanaTimezone(record.timezone)) {
      const timezoneResult = await ensureBusinessTimezone();
      if (!timezoneResult.ok) {
        return timezoneResult;
      }

      record = {
        ...record,
        timezone: timezoneResult.timezone,
      };
    }

    return { ok: true, hours: record };
  } catch (error) {
    logDevError('getOwnerBusinessHours', error);
    if (isSchemaNotReadyError(error)) {
      return {
        ok: false,
        code: 'schema_not_ready',
        message: userFacingError('schema_not_ready'),
      };
    }
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }
}

export async function updateOwnerBusinessHours(
  weeklyHours: WeeklyBusinessHours,
): Promise<UpdateOwnerBusinessHoursResult> {
  const validation = validateWeeklyBusinessHours(weeklyHours);
  if (!validation.valid) {
    return {
      ok: false,
      code: 'invalid_hours',
      message: validation.message ?? userFacingError('invalid_hours'),
    };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  const timezoneResult = await ensureBusinessTimezone();
  if (!timezoneResult.ok) {
    return timezoneResult;
  }

  const payload = weeklyHoursForDatabase(weeklyHours);

  try {
    const { data, error } = await supabase
      .from('businesses')
      .update({ weekly_hours: payload })
      .eq('id', owner.businessId)
      .eq('owner_user_id', owner.userId)
      .select(BUSINESS_HOURS_SELECT)
      .single();

    if (error) {
      logDevError('updateOwnerBusinessHours', error);
      if (isSchemaNotReadyError(error)) {
        return {
          ok: false,
          code: 'schema_not_ready',
          message: userFacingError('schema_not_ready'),
        };
      }
      const code: BusinessHoursErrorCode =
        error.code === '42501' || /permission denied|row-level security/i.test(error.message)
          ? 'permission'
          : /weekly_hours|check constraint|businesses_weekly_hours_valid/i.test(error.message)
            ? 'invalid_hours'
            : isNetworkError(error)
              ? 'network'
              : 'update_failed';
      return { ok: false, code, message: userFacingError(code) };
    }

    return { ok: true, hours: rowToOwnerRecord(data as BusinessHoursRow) };
  } catch (error) {
    logDevError('updateOwnerBusinessHours', error);
    if (isSchemaNotReadyError(error)) {
      return {
        ok: false,
        code: 'schema_not_ready',
        message: userFacingError('schema_not_ready'),
      };
    }
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError(isNetworkError(error) ? 'network' : 'update_failed'),
    };
  }
}
