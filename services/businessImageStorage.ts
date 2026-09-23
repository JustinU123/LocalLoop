import { supabase } from '@/lib/supabase';
import type { BusinessBrandingImageKind } from '@/constants/business-branding';
import { prepareImageUploadBody } from '@/services/postStorage';

export const BUSINESS_IMAGES_BUCKET = 'business-images';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[businessImageStorage:${scope}]`, error);
  }
}

function sanitizeStoragePathSegment(value: string, label: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed || trimmed.includes('/')) {
    throw new Error(`Invalid ${label} for storage path.`);
  }
  return trimmed;
}

export function buildBusinessBrandingStoragePath(
  businessId: string,
  userId: string,
  kind: BusinessBrandingImageKind,
  extension: string,
): string {
  const businessSegment = sanitizeStoragePathSegment(businessId, 'business ID');
  const userSegment = sanitizeStoragePathSegment(userId, 'user ID');
  if (kind !== 'logo' && kind !== 'cover') {
    throw new Error('Invalid business image kind.');
  }
  const safeExtension = extension.replace(/^\./, '').toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 10);
  const path = `${businessSegment}/${userSegment}/${kind}/${timestamp}-${randomId}.${safeExtension}`;

  if (path.startsWith('/') || path.includes('//')) {
    throw new Error('Invalid storage path.');
  }

  return path;
}

export type UploadBusinessImageResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; message: string };

export async function uploadBusinessImage(params: {
  businessId: string;
  userId: string;
  kind: BusinessBrandingImageKind;
  uri: string;
  fileName?: string | null;
}): Promise<UploadBusinessImageResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logDevError('uploadBusinessImage.auth', userError);
      return { ok: false, message: 'Please sign in again to upload.' };
    }

    if (params.userId !== user.id) {
      logDevError('uploadBusinessImage.auth', {
        message: 'Upload user ID does not match authenticated session.',
        sessionUserId: user.id,
        providedUserId: params.userId,
      });
      return { ok: false, message: "We couldn't upload this image. Please try again." };
    }

    const { body, contentType, extension } = await prepareImageUploadBody(params.uri, params.fileName);
    const path = buildBusinessBrandingStoragePath(params.businessId, user.id, params.kind, extension);

    if (__DEV__) {
      console.log('[businessImageStorage:uploadBusinessImage] DEBUG', {
        path,
        authenticatedUserId: user.id,
        providedUserId: params.userId,
        businessId: params.businessId,
        kind: params.kind,
      });
    }

    const { error } = await supabase.storage.from(BUSINESS_IMAGES_BUCKET).upload(path, body, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    });

    if (error) {
      logDevError('uploadBusinessImage', error);
      return { ok: false, message: "We couldn't upload this image. Please try again." };
    }

    const { data } = supabase.storage.from(BUSINESS_IMAGES_BUCKET).getPublicUrl(path);

    return {
      ok: true,
      path,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    logDevError('uploadBusinessImage', error);
    return { ok: false, message: "We couldn't upload this image. Please try again." };
  }
}

export function extractBusinessImageStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) {
    return null;
  }

  const trimmed = publicUrl.trim();
  if (!trimmed) {
    return null;
  }

  const marker = `/storage/v1/object/public/${BUSINESS_IMAGES_BUCKET}/`;
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const rawPath = trimmed.slice(markerIndex + marker.length).split('?')[0] ?? '';
  if (!rawPath || rawPath.includes('..')) {
    return null;
  }

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return null;
  }
}

export async function deleteUploadedBusinessImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(BUSINESS_IMAGES_BUCKET).remove([path]);
    if (error) {
      logDevError('deleteUploadedBusinessImage', error);
    }
  } catch (error) {
    logDevError('deleteUploadedBusinessImage', error);
  }
}
