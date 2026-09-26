import { supabase } from '@/lib/supabase';
import {
  buildBusinessImageStoragePath,
  prepareImageUploadBody,
} from '@/services/postStorage';

export const PROMOTION_IMAGES_BUCKET = 'promotion-images';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[promotionStorage:${scope}]`, error);
  }
}

export type UploadPromotionImageResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; message: string };

export async function uploadPromotionImage(params: {
  businessId: string;
  userId: string;
  uri: string;
  fileName?: string | null;
}): Promise<UploadPromotionImageResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logDevError('uploadPromotionImage.auth', userError);
      return { ok: false, message: 'Please sign in again to publish.' };
    }

    if (params.userId !== user.id) {
      logDevError('uploadPromotionImage.auth', {
        message: 'Upload user ID does not match authenticated session.',
        sessionUserId: user.id,
        providedUserId: params.userId,
      });
      return { ok: false, message: "We couldn't upload your promotion image. Please try again." };
    }

    const { body, contentType, extension } = await prepareImageUploadBody(
      params.uri,
      params.fileName,
    );
    const path = buildBusinessImageStoragePath(params.businessId, user.id, extension);

    const { error } = await supabase.storage.from(PROMOTION_IMAGES_BUCKET).upload(path, body, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    });

    if (error) {
      logDevError('uploadPromotionImage', error);
      return { ok: false, message: "We couldn't upload your promotion image. Please try again." };
    }

    const { data } = supabase.storage.from(PROMOTION_IMAGES_BUCKET).getPublicUrl(path);

    return {
      ok: true,
      path,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    logDevError('uploadPromotionImage', error);
    return { ok: false, message: "We couldn't upload your promotion image. Please try again." };
  }
}

/** Extract storage object path from a public promotion-images URL, if present. */
export function extractPromotionImageStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) {
    return null;
  }

  const trimmed = publicUrl.trim();
  if (!trimmed) {
    return null;
  }

  const marker = `/storage/v1/object/public/${PROMOTION_IMAGES_BUCKET}/`;
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

export async function deleteUploadedPromotionImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(PROMOTION_IMAGES_BUCKET).remove([path]);
    if (error) {
      logDevError('deleteUploadedPromotionImage', error);
    }
  } catch (error) {
    logDevError('deleteUploadedPromotionImage', error);
  }
}
