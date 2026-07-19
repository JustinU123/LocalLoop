import { supabase } from '@/lib/supabase';

export const POST_IMAGES_BUCKET = 'post-images';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[postStorage:${scope}]`, error);
  }
}

function inferExtension(uri: string, fileName?: string | null, contentType?: string | null): string {
  if (contentType && MIME_TO_EXTENSION[contentType]) {
    return MIME_TO_EXTENSION[contentType];
  }

  const candidate = fileName?.trim() || uri;
  const match = candidate.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }

  return 'jpg';
}

function inferContentType(extension: string): string {
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}

function sanitizeStoragePathSegment(value: string, label: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed || trimmed.includes('/')) {
    throw new Error(`Invalid ${label} for storage path.`);
  }
  return trimmed;
}

export function buildPostImageStoragePath(
  businessId: string,
  userId: string,
  extension: string,
): string {
  const businessSegment = sanitizeStoragePathSegment(businessId, 'business ID');
  const userSegment = sanitizeStoragePathSegment(userId, 'user ID');
  const safeExtension = extension.replace(/^\./, '').toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 10);
  const path = `${businessSegment}/${userSegment}/${timestamp}-${randomId}.${safeExtension}`;

  if (path.startsWith('/') || path.includes('//')) {
    throw new Error('Invalid storage path.');
  }

  return path;
}

export async function prepareImageUploadBody(
  uri: string,
  fileName?: string | null,
): Promise<{ body: ArrayBuffer; contentType: string; extension: string }> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read image (${response.status})`);
  }

  const blob = await response.blob();
  const body = await new Response(blob).arrayBuffer();
  const extension = inferExtension(uri, fileName, blob.type);
  const contentType = blob.type || inferContentType(extension);

  return { body, contentType, extension };
}

export type UploadPostImageResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; message: string };

export async function uploadPostImage(params: {
  businessId: string;
  userId: string;
  uri: string;
  fileName?: string | null;
}): Promise<UploadPostImageResult> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logDevError('uploadPostImage.auth', userError);
      return { ok: false, message: 'Please sign in again to publish.' };
    }

    if (params.userId !== user.id) {
      logDevError('uploadPostImage.auth', {
        message: 'Upload user ID does not match authenticated session.',
        sessionUserId: user.id,
        providedUserId: params.userId,
      });
      return { ok: false, message: "We couldn't upload your photo. Please try again." };
    }

    const { body, contentType, extension } = await prepareImageUploadBody(params.uri, params.fileName);
    const path = buildPostImageStoragePath(params.businessId, user.id, extension);

    if (__DEV__) {
      console.log('[postStorage:uploadPostImage] path', path);
    }

    const { error } = await supabase.storage.from(POST_IMAGES_BUCKET).upload(path, body, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    });

    if (error) {
      logDevError('uploadPostImage', error);
      return { ok: false, message: "We couldn't upload your photo. Please try again." };
    }

    const { data } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(path);

    return {
      ok: true,
      path,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    logDevError('uploadPostImage', error);
    return { ok: false, message: "We couldn't upload your photo. Please try again." };
  }
}

export async function deleteUploadedPostImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(POST_IMAGES_BUCKET).remove([path]);
    if (error) {
      logDevError('deleteUploadedPostImage', error);
    }
  } catch (error) {
    logDevError('deleteUploadedPostImage', error);
  }
}
