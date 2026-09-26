import { supabase } from '@/lib/supabase';
import {
  buildBusinessImageStoragePath,
  prepareImageUploadBody,
} from '@/services/postStorage';

export const EVENT_IMAGES_BUCKET = 'event-images';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[eventStorage:${scope}]`, error);
  }
}

export type UploadEventImageResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; message: string };

export async function uploadEventImage(params: {
  businessId: string;
  userId: string;
  uri: string;
  fileName?: string | null;
}): Promise<UploadEventImageResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logDevError('uploadEventImage.auth', userError);
      return { ok: false, message: 'Please sign in again to publish.' };
    }

    if (params.userId !== user.id) {
      logDevError('uploadEventImage.auth', {
        message: 'Upload user ID does not match authenticated session.',
        sessionUserId: user.id,
        providedUserId: params.userId,
      });
      return { ok: false, message: "We couldn't upload your event image. Please try again." };
    }

    const { body, contentType, extension } = await prepareImageUploadBody(params.uri, params.fileName);
    const path = buildBusinessImageStoragePath(params.businessId, user.id, extension);

    const { error } = await supabase.storage.from(EVENT_IMAGES_BUCKET).upload(path, body, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    });

    if (error) {
      logDevError('uploadEventImage', error);
      return { ok: false, message: "We couldn't upload your event image. Please try again." };
    }

    const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);

    return {
      ok: true,
      path,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    logDevError('uploadEventImage', error);
    return { ok: false, message: "We couldn't upload your event image. Please try again." };
  }
}

export function extractEventImageStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) {
    return null;
  }

  const trimmed = publicUrl.trim();
  if (!trimmed) {
    return null;
  }

  const marker = `/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/`;
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

export async function deleteUploadedEventImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(EVENT_IMAGES_BUCKET).remove([path]);
    if (error) {
      logDevError('deleteUploadedEventImage', error);
    }
  } catch (error) {
    logDevError('deleteUploadedEventImage', error);
  }
}
