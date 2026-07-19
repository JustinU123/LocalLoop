import { supabase } from '@/lib/supabase';
import { deleteUploadedPostImage, uploadPostImage } from '@/services/postStorage';
import { getCurrentUserBusiness } from '@/services/businesses';
import type { BusinessRow } from '@/types/supabase-business';
import type { BusinessPost, PostRow } from '@/types/supabase-post';
import { getCurrentSession } from '@/utils/auth';

export type PostErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'no_image'
  | 'network'
  | 'upload_failed'
  | 'insert_failed'
  | 'unexpected';

export type PublishPhotoPostResult =
  | { ok: true; post: BusinessPost }
  | { ok: false; code: PostErrorCode; message: string };

export type GetBusinessPostsResult =
  | { ok: true; posts: BusinessPost[] }
  | { ok: false; code: PostErrorCode; message: string };

const POST_SELECT =
  'id, business_id, caption, image_url, status, created_at, updated_at';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[posts:${scope}]`, error);
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

function userFacingError(code: PostErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to publish.';
    case 'not_verified':
      return 'Your business must be verified before you can publish.';
    case 'no_image':
      return 'Select a photo before publishing.';
    case 'network':
      return 'Check your connection and try again.';
    case 'upload_failed':
      return "We couldn't upload your photo. Please try again.";
    case 'insert_failed':
      return "We couldn't publish your post. Please try again.";
    default:
      return "We couldn't publish your post. Please try again.";
  }
}

function postRowToBusinessPost(row: PostRow): BusinessPost | null {
  if (!row.image_url) {
    return null;
  }

  return {
    id: row.id,
    businessId: row.business_id,
    caption: row.caption,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function formatPostCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function getCurrentVerifiedBusiness(): Promise<
  | { ok: true; business: BusinessRow; userId: string }
  | { ok: false; code: PostErrorCode; message: string }
> {
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

    const { business, error } = await getCurrentUserBusiness();
    if (error) {
      return {
        ok: false,
        code: error === 'network' ? 'network' : 'unexpected',
        message: userFacingError(error === 'network' ? 'network' : 'unexpected'),
      };
    }

    if (!business || business.verification_status !== 'verified') {
      return {
        ok: false,
        code: 'not_verified',
        message: userFacingError('not_verified'),
      };
    }

    if (business.owner_user_id !== userId) {
      logDevError('getCurrentVerifiedBusiness', {
        message: 'Business owner does not match authenticated session.',
        businessOwnerUserId: business.owner_user_id,
        sessionUserId: userId,
      });
      return {
        ok: false,
        code: 'unexpected',
        message: userFacingError('unexpected'),
      };
    }

    return {
      ok: true,
      business,
      userId,
    };
  } catch (error) {
    logDevError('getCurrentVerifiedBusiness', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }
}

export async function publishPhotoPost(params: {
  imageUri: string;
  fileName?: string | null;
  caption?: string;
}): Promise<PublishPhotoPostResult> {
  const trimmedCaption = params.caption?.trim() ?? '';
  const caption = trimmedCaption.length > 0 ? trimmedCaption : null;

  if (!params.imageUri?.trim()) {
    return {
      ok: false,
      code: 'no_image',
      message: userFacingError('no_image'),
    };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return verified;
  }

  const { business, userId } = verified;

  const uploadResult = await uploadPostImage({
    businessId: business.id,
    userId,
    uri: params.imageUri,
    fileName: params.fileName,
  });

  if (!uploadResult.ok) {
    return {
      ok: false,
      code: 'upload_failed',
      message: uploadResult.message,
    };
  }

  const { path, publicUrl } = uploadResult;

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        business_id: business.id,
        caption,
        image_url: publicUrl,
        status: 'published',
      })
      .select(POST_SELECT)
      .single();

    if (error) {
      logDevError('publishPhotoPost.insert', error);
      await deleteUploadedPostImage(path);
      const code: PostErrorCode = isNetworkError(error) ? 'network' : 'insert_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code === 'network' ? 'network' : 'insert_failed'),
      };
    }

    const post = postRowToBusinessPost(data as PostRow);
    if (!post) {
      await deleteUploadedPostImage(path);
      return {
        ok: false,
        code: 'insert_failed',
        message: userFacingError('insert_failed'),
      };
    }

    return { ok: true, post };
  } catch (error) {
    logDevError('publishPhotoPost', error);
    await deleteUploadedPostImage(path);
    const code = isNetworkError(error) ? 'network' : 'insert_failed';
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }
}

export async function getBusinessPosts(businessId: string): Promise<GetBusinessPostsResult> {
  if (!businessId) {
    return { ok: true, posts: [] };
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('business_id', businessId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      logDevError('getBusinessPosts', error);
      const code: PostErrorCode = isNetworkError(error) ? 'network' : 'unexpected';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const posts = ((data as PostRow[] | null) ?? [])
      .map(postRowToBusinessPost)
      .filter((post): post is BusinessPost => post !== null);

    return { ok: true, posts };
  } catch (error) {
    logDevError('getBusinessPosts', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }
}
