import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { BusinessApplication, VerificationStatus } from '@/types/account-mode';
import type { BusinessRow, DbVerificationStatus, ProfileRow } from '@/types/supabase-business';
import { getCurrentSession } from '@/utils/auth';

export type BusinessErrorCode =
  | 'unauthenticated'
  | 'network'
  | 'permission'
  | 'duplicate_pending'
  | 'unexpected';

export type BusinessSubmissionResult =
  | { ok: true; status: 'submitted' | 'updated' | 'already_verified' | 'already_pending' }
  | { ok: false; code: BusinessErrorCode; message: string };

const BUSINESS_SELECT =
  'id, owner_user_id, name, category, description, phone, email, instagram, website, street_address, city, state, postal_code, latitude, longitude, verification_status, verified_at, created_at, updated_at';

export const UNSUPPORTED_APPLICATION_FIELDS = [
  'googleBusinessListing',
  'yelpPage',
  'otherSocialProfile',
  'verificationMethod',
  'verificationExplanation',
  'ownershipConfirmed',
  'proofUploads',
] as const;

export function resolveVerificationStatus(
  business: BusinessRow | null,
  asyncStorageFallback: VerificationStatus,
): VerificationStatus {
  if (business) {
    return business.verification_status;
  }
  return asyncStorageFallback;
}

export function businessRowToApplication(row: BusinessRow): BusinessApplication {
  return {
    businessName: row.name,
    category: row.category ?? '',
    description: row.description ?? '',
    addressOrServiceArea: row.street_address ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zipCode: row.postal_code ?? '',
    businessPhone: row.phone ?? '',
    publicBusinessEmail: row.email ?? '',
    instagram: row.instagram ?? '',
    website: row.website ?? '',
    googleBusinessListing: '',
    yelpPage: '',
    otherSocialProfile: '',
    verificationMethod: null,
    verificationExplanation: '',
    ownershipConfirmed: true,
    submittedAt: row.updated_at ?? row.created_at,
  };
}

function applicationToBusinessPayload(application: Omit<BusinessApplication, 'submittedAt'>) {
  return {
    name: application.businessName.trim(),
    category: application.category.trim() || null,
    description: application.description.trim() || null,
    phone: application.businessPhone.trim() || null,
    email: application.publicBusinessEmail.trim() || null,
    instagram: application.instagram.trim() || null,
    website: application.website.trim() || null,
    street_address: application.addressOrServiceArea.trim() || null,
    city: application.city.trim() || null,
    state: application.state.trim() || null,
    postal_code: application.zipCode.trim() || null,
  };
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

function mapPostgrestError(error: PostgrestError): BusinessErrorCode {
  if (error.code === '42501' || /permission denied|row-level security/i.test(error.message)) {
    return 'permission';
  }
  return 'unexpected';
}

function userFacingError(code: BusinessErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to submit your business application.';
    case 'network':
      return "We couldn't submit your application. Check your connection and try again.";
    case 'permission':
      return "We couldn't save your business application.";
    case 'duplicate_pending':
      return 'Your application is already pending review.';
    default:
      return "We couldn't submit your application right now. Please try again.";
  }
}

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[businesses:${scope}]`, error);
  }
}

export async function getCurrentUserBusiness(): Promise<{
  business: BusinessRow | null;
  userId: string | null;
  error: BusinessErrorCode | null;
}> {
  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return { business: null, userId: null, error: null };
    }

    const { data, error } = await supabase
      .from('businesses')
      .select(BUSINESS_SELECT)
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (error) {
      logDevError('getCurrentUserBusiness', error);
      return {
        business: null,
        userId,
        error: isNetworkError(error) ? 'network' : mapPostgrestError(error),
      };
    }

    return { business: (data as BusinessRow | null) ?? null, userId, error: null };
  } catch (error) {
    logDevError('getCurrentUserBusiness', error);
    return {
      business: null,
      userId: null,
      error: isNetworkError(error) ? 'network' : 'unexpected',
    };
  }
}

export async function getCurrentUserProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, account_type, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logDevError('getCurrentUserProfile', error);
      return null;
    }

    return (data as ProfileRow | null) ?? null;
  } catch (error) {
    logDevError('getCurrentUserProfile', error);
    return null;
  }
}

export async function getBusinessVerificationStatus(
  business: BusinessRow | null,
  asyncStorageFallback: VerificationStatus,
): Promise<VerificationStatus> {
  return resolveVerificationStatus(business, asyncStorageFallback);
}

async function updateProfileAccountType(userId: string): Promise<BusinessSubmissionResult> {
  const { error } = await supabase
    .from('profiles')
    .update({ account_type: 'business' })
    .eq('id', userId);

  if (error) {
    logDevError('updateProfileAccountType', error);
    const code = isNetworkError(error) ? 'network' : mapPostgrestError(error);
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }

  return { ok: true, status: 'submitted' };
}

export async function submitBusinessApplication(
  application: Omit<BusinessApplication, 'submittedAt'>,
): Promise<BusinessSubmissionResult> {
  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        ok: false,
        code: 'unauthenticated',
        message: userFacingError('unauthenticated'),
      };
    }

    const { business: existing, error: lookupError } = await getCurrentUserBusiness();
    if (lookupError) {
      return {
        ok: false,
        code: lookupError,
        message: userFacingError(lookupError),
      };
    }

    if (existing?.verification_status === 'verified') {
      return { ok: true, status: 'already_verified' };
    }

    if (existing?.verification_status === 'pending') {
      return { ok: true, status: 'already_pending' };
    }

    const payload = applicationToBusinessPayload(application);
    const resubmittableStatuses: DbVerificationStatus[] = [
      'not_submitted',
      'needs_information',
      'rejected',
    ];

    if (!existing) {
      const { error } = await supabase.from('businesses').insert({
        owner_user_id: userId,
        ...payload,
        verification_status: 'pending',
        verified_at: null,
      });

      if (error) {
        logDevError('submitBusinessApplication.insert', error);
        const code = isNetworkError(error) ? 'network' : mapPostgrestError(error);
        return { ok: false, code, message: userFacingError(code) };
      }
    } else if (resubmittableStatuses.includes(existing.verification_status)) {
      const { error } = await supabase
        .from('businesses')
        .update({
          ...payload,
          verification_status: 'pending',
        })
        .eq('id', existing.id)
        .eq('owner_user_id', userId);

      if (error) {
        logDevError('submitBusinessApplication.update', error);
        const code = isNetworkError(error) ? 'network' : mapPostgrestError(error);
        return { ok: false, code, message: userFacingError(code) };
      }

      const profileResult = await updateProfileAccountType(userId);
      if (!profileResult.ok) {
        return profileResult;
      }

      return { ok: true, status: 'updated' };
    } else {
      return { ok: true, status: 'already_pending' };
    }

    const profileResult = await updateProfileAccountType(userId);
    if (!profileResult.ok) {
      return profileResult;
    }

    return { ok: true, status: 'submitted' };
  } catch (error) {
    logDevError('submitBusinessApplication', error);
    const code = isNetworkError(error) ? 'network' : 'unexpected';
    return { ok: false, code, message: userFacingError(code) };
  }
}

export async function updateBusinessApplication(
  application: Omit<BusinessApplication, 'submittedAt'>,
): Promise<BusinessSubmissionResult> {
  return submitBusinessApplication(application);
}
