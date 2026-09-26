import { supabase } from '@/lib/supabase';
import {
  buildBusinessImageStoragePath,
  prepareImageUploadBody,
} from '@/services/postStorage';

export const MENU_IMAGES_BUCKET = 'menu-images';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[menuStorage:${scope}]`, error);
  }
}

export type UploadMenuImageResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; message: string };

export async function uploadMenuImage(params: {
  businessId: string;
  userId: string;
  uri: string;
  fileName?: string | null;
}): Promise<UploadMenuImageResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logDevError('uploadMenuImage.auth', userError);
      return { ok: false, message: 'Please sign in again to publish.' };
    }

    if (params.userId !== user.id) {
      logDevError('uploadMenuImage.auth', {
        message: 'Upload user ID does not match authenticated session.',
        sessionUserId: user.id,
        providedUserId: params.userId,
      });
      return { ok: false, message: "We couldn't upload your item image. Please try again." };
    }

    const { body, contentType, extension } = await prepareImageUploadBody(params.uri, params.fileName);
    const path = buildBusinessImageStoragePath(params.businessId, user.id, extension);

    const { error } = await supabase.storage.from(MENU_IMAGES_BUCKET).upload(path, body, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    });

    if (error) {
      logDevError('uploadMenuImage', error);
      return { ok: false, message: "We couldn't upload your item image. Please try again." };
    }

    const { data } = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(path);

    return {
      ok: true,
      path,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    logDevError('uploadMenuImage', error);
    return { ok: false, message: "We couldn't upload your item image. Please try again." };
  }
}

export function extractMenuImageStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) {
    return null;
  }

  const trimmed = publicUrl.trim();
  if (!trimmed) {
    return null;
  }

  const marker = `/storage/v1/object/public/${MENU_IMAGES_BUCKET}/`;
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

export async function deleteUploadedMenuImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(MENU_IMAGES_BUCKET).remove([path]);
    if (error) {
      logDevError('deleteUploadedMenuImage', error);
    }
  } catch (error) {
    logDevError('deleteUploadedMenuImage', error);
  }
}
