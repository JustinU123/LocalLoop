import { supabase } from '@/lib/supabase';
import { getCurrentUserBusiness } from '@/services/businesses';
import type { BusinessProfileForm } from '@/types/business-profile-form';
import type { BusinessRow } from '@/types/supabase-business';
import {
  buildAddressFingerprint,
  buildAddressFingerprintFromRow,
  buildGeocodeQuery,
  validateBusinessProfileForm,
} from '@/utils/business-profile-form';
import { geocodeBusinessAddress } from '@/utils/geocode-business-address';
import {
  isValidIanaTimezone,
  resolveBusinessTimezoneFromCoordinates,
} from '@/utils/business-timezone';

export type BusinessProfileErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'not_found'
  | 'invalid_form'
  | 'network'
  | 'permission'
  | 'update_failed'
  | 'unexpected';

export type UpdateBusinessProfileResult =
  | {
      ok: true;
      business: BusinessRow;
      geocoded: boolean;
      coordinatesCleared: boolean;
    }
  | { ok: false; code: BusinessProfileErrorCode; message: string };

const BUSINESS_SELECT =
  'id, owner_user_id, name, category, description, phone, email, instagram, website, street_address, city, state, postal_code, latitude, longitude, timezone, weekly_hours, verification_status, verified_at, created_at, updated_at';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[businessProfile:${scope}]`, error);
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

function userFacingError(code: BusinessProfileErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to save your profile.';
    case 'not_verified':
      return 'Only verified businesses can edit their public profile.';
    case 'not_found':
      return 'We could not find your business profile.';
    case 'invalid_form':
      return 'Complete all required profile fields before saving.';
    case 'network':
      return 'Check your connection and try again.';
    case 'permission':
      return 'You do not have permission to update this business.';
    default:
      return 'We could not save your business profile. Please try again.';
  }
}

function profileFormToUpdatePayload(
  form: BusinessProfileForm,
  latitude: number | null,
  longitude: number | null,
  timezone: string | null,
) {
  return {
    name: form.name.trim(),
    category: form.category.trim() || null,
    description: form.description.trim() || null,
    street_address: form.streetAddress.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    postal_code: form.postalCode.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    website: form.website.trim() || null,
    instagram: form.instagram.trim() || null,
    latitude,
    longitude,
    timezone,
  };
}

export async function updateVerifiedBusinessProfile(
  form: BusinessProfileForm,
  previousRow: BusinessRow,
): Promise<UpdateBusinessProfileResult> {
  const validation = validateBusinessProfileForm(form);
  if (!validation.valid) {
    return {
      ok: false,
      code: 'invalid_form',
      message: validation.message ?? userFacingError('invalid_form'),
    };
  }

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

  if (!business || business.id !== previousRow.id) {
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

  const addressChanged =
    buildAddressFingerprint(form) !== buildAddressFingerprintFromRow(previousRow);

  let latitude = business.latitude;
  let longitude = business.longitude;
  let geocoded = false;
  let coordinatesCleared = false;

  if (addressChanged) {
    const geocodeQuery = buildGeocodeQuery(form);
    const geocodeResult = await geocodeBusinessAddress(geocodeQuery);

    if (geocodeResult.ok) {
      latitude = geocodeResult.latitude;
      longitude = geocodeResult.longitude;
      geocoded = true;
    } else {
      latitude = null;
      longitude = null;
      coordinatesCleared = true;
    }
  }

  let timezone: string | null = business.timezone ?? null;

  if (coordinatesCleared) {
    timezone = null;
  } else if (latitude !== null && longitude !== null) {
    const coordinatesChanged =
      geocoded ||
      business.latitude !== latitude ||
      business.longitude !== longitude;

    if (coordinatesChanged || !isValidIanaTimezone(timezone)) {
      const resolved = await resolveBusinessTimezoneFromCoordinates(latitude, longitude);
      timezone = resolved.ok ? resolved.timezone : null;
    }
  }

  const payload = profileFormToUpdatePayload(form, latitude, longitude, timezone);

  try {
    const { data, error } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', business.id)
      .eq('owner_user_id', userId)
      .select(BUSINESS_SELECT)
      .single();

    if (error) {
      logDevError('updateVerifiedBusinessProfile', error);
      const code: BusinessProfileErrorCode =
        error.code === '42501' || /permission denied|row-level security/i.test(error.message)
          ? 'permission'
          : isNetworkError(error)
            ? 'network'
            : 'update_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    return {
      ok: true,
      business: data as BusinessRow,
      geocoded,
      coordinatesCleared,
    };
  } catch (error) {
    logDevError('updateVerifiedBusinessProfile', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError(isNetworkError(error) ? 'network' : 'update_failed'),
    };
  }
}
