import { supabase } from '@/lib/supabase';
import {
  deleteUploadedBusinessImage,
  uploadBusinessImage,
} from '@/services/businessImageStorage';
import { getCurrentVerifiedBusiness } from '@/services/posts';
import { prepareBusinessBrandingImage } from '@/utils/prepare-business-branding-image';

export type BusinessBrandingErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'upload_failed'
  | 'schema_not_ready'
  | 'network'
  | 'permission'
  | 'update_failed'
  | 'unexpected';

export type OwnerBusinessBranding = {
  businessId: string;
  logoUrl: string | null;
  logoStoragePath: string | null;
  coverImageUrl: string | null;
  coverStoragePath: string | null;
};

export type GetOwnerBusinessBrandingResult =
  | { ok: true; branding: OwnerBusinessBranding }
  | { ok: false; code: BusinessBrandingErrorCode; message: string };

export type MutateOwnerBusinessBrandingResult =
  | { ok: true; branding: OwnerBusinessBranding }
  | { ok: false; code: BusinessBrandingErrorCode; message: string };

const BRANDING_SELECT =
  'id, owner_user_id, verification_status, logo_url, logo_storage_path, cover_image_url, cover_storage_path';

type BrandingRow = {
  id: string;
  owner_user_id: string;
  verification_status: string;
  logo_url: string | null;
  logo_storage_path: string | null;
  cover_image_url: string | null;
  cover_storage_path: string | null;
};

function logDevError(scope: string, error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error(`[businessBranding:${scope}]`, context ?? {}, error);
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

  return /logo_url|cover_image_url|column.*does not exist|schema cache/i.test(message);
}

function userFacingError(code: BusinessBrandingErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to manage photos and branding.';
    case 'not_verified':
      return 'Only verified businesses can manage photos and branding.';
    case 'upload_failed':
      return "We couldn't upload this image. Please try again.";
    case 'schema_not_ready':
      return 'Photos and branding storage is not available yet. Apply the business branding migration to your Supabase project first.';
    case 'network':
      return 'Check your connection and try again.';
    case 'permission':
      return 'You do not have permission to update this business.';
    default:
      return 'We could not save your photos and branding. Please try again.';
  }
}

function rowToBranding(row: BrandingRow): OwnerBusinessBranding {
  return {
    businessId: row.id,
    logoUrl: row.logo_url?.trim() || null,
    logoStoragePath: row.logo_storage_path?.trim() || null,
    coverImageUrl: row.cover_image_url?.trim() || null,
    coverStoragePath: row.cover_storage_path?.trim() || null,
  };
}

async function loadOwnerBrandingRow(businessId: string): Promise<
  | { ok: true; row: BrandingRow }
  | { ok: false; code: BusinessBrandingErrorCode; message: string }
> {
  const { data, error } = await supabase
    .from('businesses')
    .select(BRANDING_SELECT)
    .eq('id', businessId)
    .maybeSingle();

  if (error) {
    logDevError('loadOwnerBrandingRow', error, { businessId });
    if (isSchemaNotReadyError(error)) {
      return { ok: false, code: 'schema_not_ready', message: userFacingError('schema_not_ready') };
    }
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError('unexpected'),
    };
  }

  if (!data) {
    return { ok: false, code: 'unexpected', message: userFacingError('unexpected') };
  }

  return { ok: true, row: data as BrandingRow };
}

export async function getOwnerBusinessBranding(): Promise<GetOwnerBusinessBrandingResult> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return {
      ok: false,
      code: verified.code as BusinessBrandingErrorCode,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code as BusinessBrandingErrorCode)
          : verified.message,
    };
  }

  const rowResult = await loadOwnerBrandingRow(verified.business.id);
  if (!rowResult.ok) {
    return rowResult;
  }

  return { ok: true, branding: rowToBranding(rowResult.row) };
}

async function uploadPreparedBrandingAsset(params: {
  businessId: string;
  userId: string;
  kind: 'logo' | 'cover';
  uri: string;
  fileName?: string | null;
  width?: number | null;
  height?: number | null;
}): Promise<
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; code: BusinessBrandingErrorCode; message: string }
> {
  const prepared = await prepareBusinessBrandingImage({
    uri: params.uri,
    kind: params.kind,
    width: params.width,
    height: params.height,
    fileName: params.fileName,
  });

  if (!prepared.ok) {
    return { ok: false, code: 'upload_failed', message: prepared.message };
  }

  const uploadResult = await uploadBusinessImage({
    businessId: params.businessId,
    userId: params.userId,
    kind: params.kind,
    uri: prepared.uri,
    fileName: `upload.${prepared.extension}`,
  });

  if (!uploadResult.ok) {
    return { ok: false, code: 'upload_failed', message: uploadResult.message };
  }

  return { ok: true, path: uploadResult.path, publicUrl: uploadResult.publicUrl };
}

export async function setOwnerBusinessLogo(params: {
  imageUri: string;
  fileName?: string | null;
  width?: number | null;
  height?: number | null;
}): Promise<MutateOwnerBusinessBrandingResult> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return {
      ok: false,
      code: verified.code as BusinessBrandingErrorCode,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code as BusinessBrandingErrorCode)
          : verified.message,
    };
  }

  const { business, userId } = verified;
  const current = await loadOwnerBrandingRow(business.id);
  if (!current.ok) {
    return current;
  }

  const previousPath = current.row.logo_storage_path?.trim() || null;

  const uploaded = await uploadPreparedBrandingAsset({
    businessId: business.id,
    userId,
    kind: 'logo',
    uri: params.imageUri,
    fileName: params.fileName,
    width: params.width,
    height: params.height,
  });

  if (!uploaded.ok) {
    return uploaded;
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      logo_url: uploaded.publicUrl,
      logo_storage_path: uploaded.path,
    })
    .eq('id', business.id)
    .eq('owner_user_id', userId);

  if (error) {
    logDevError('setOwnerBusinessLogo.update', error);
    await deleteUploadedBusinessImage(uploaded.path);
    if (isSchemaNotReadyError(error)) {
      return { ok: false, code: 'schema_not_ready', message: userFacingError('schema_not_ready') };
    }
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError('update_failed'),
    };
  }

  if (previousPath && previousPath !== uploaded.path) {
    await deleteUploadedBusinessImage(previousPath);
  }

  const rowResult = await loadOwnerBrandingRow(business.id);
  if (!rowResult.ok) {
    return rowResult;
  }

  return { ok: true, branding: rowToBranding(rowResult.row) };
}

export async function removeOwnerBusinessLogo(): Promise<MutateOwnerBusinessBrandingResult> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return {
      ok: false,
      code: verified.code as BusinessBrandingErrorCode,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code as BusinessBrandingErrorCode)
          : verified.message,
    };
  }

  const current = await loadOwnerBrandingRow(verified.business.id);
  if (!current.ok) {
    return current;
  }

  const previousPath = current.row.logo_storage_path?.trim() || null;

  const { error } = await supabase
    .from('businesses')
    .update({
      logo_url: null,
      logo_storage_path: null,
    })
    .eq('id', verified.business.id)
    .eq('owner_user_id', verified.userId);

  if (error) {
    logDevError('removeOwnerBusinessLogo', error);
    if (isSchemaNotReadyError(error)) {
      return { ok: false, code: 'schema_not_ready', message: userFacingError('schema_not_ready') };
    }
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError('update_failed'),
    };
  }

  if (previousPath) {
    await deleteUploadedBusinessImage(previousPath);
  }

  const rowResult = await loadOwnerBrandingRow(verified.business.id);
  if (!rowResult.ok) {
    return rowResult;
  }

  return { ok: true, branding: rowToBranding(rowResult.row) };
}

export async function setOwnerBusinessCover(params: {
  imageUri: string;
  fileName?: string | null;
  width?: number | null;
  height?: number | null;
}): Promise<MutateOwnerBusinessBrandingResult> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return {
      ok: false,
      code: verified.code as BusinessBrandingErrorCode,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code as BusinessBrandingErrorCode)
          : verified.message,
    };
  }

  const { business, userId } = verified;
  const current = await loadOwnerBrandingRow(business.id);
  if (!current.ok) {
    return current;
  }

  const previousPath = current.row.cover_storage_path?.trim() || null;

  const uploaded = await uploadPreparedBrandingAsset({
    businessId: business.id,
    userId,
    kind: 'cover',
    uri: params.imageUri,
    fileName: params.fileName,
    width: params.width,
    height: params.height,
  });

  if (!uploaded.ok) {
    return uploaded;
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      cover_image_url: uploaded.publicUrl,
      cover_storage_path: uploaded.path,
    })
    .eq('id', business.id)
    .eq('owner_user_id', userId);

  if (error) {
    logDevError('setOwnerBusinessCover.update', error);
    await deleteUploadedBusinessImage(uploaded.path);
    if (isSchemaNotReadyError(error)) {
      return { ok: false, code: 'schema_not_ready', message: userFacingError('schema_not_ready') };
    }
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError('update_failed'),
    };
  }

  if (previousPath && previousPath !== uploaded.path) {
    await deleteUploadedBusinessImage(previousPath);
  }

  const rowResult = await loadOwnerBrandingRow(business.id);
  if (!rowResult.ok) {
    return rowResult;
  }

  return { ok: true, branding: rowToBranding(rowResult.row) };
}

export async function removeOwnerBusinessCover(): Promise<MutateOwnerBusinessBrandingResult> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return {
      ok: false,
      code: verified.code as BusinessBrandingErrorCode,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code as BusinessBrandingErrorCode)
          : verified.message,
    };
  }

  const current = await loadOwnerBrandingRow(verified.business.id);
  if (!current.ok) {
    return current;
  }

  const previousPath = current.row.cover_storage_path?.trim() || null;

  const { error } = await supabase
    .from('businesses')
    .update({
      cover_image_url: null,
      cover_storage_path: null,
    })
    .eq('id', verified.business.id)
    .eq('owner_user_id', verified.userId);

  if (error) {
    logDevError('removeOwnerBusinessCover', error);
    if (isSchemaNotReadyError(error)) {
      return { ok: false, code: 'schema_not_ready', message: userFacingError('schema_not_ready') };
    }
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError('update_failed'),
    };
  }

  if (previousPath) {
    await deleteUploadedBusinessImage(previousPath);
  }

  const rowResult = await loadOwnerBrandingRow(verified.business.id);
  if (!rowResult.ok) {
    return rowResult;
  }

  return { ok: true, branding: rowToBranding(rowResult.row) };
}
