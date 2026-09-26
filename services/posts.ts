import { supabase } from '@/lib/supabase';
import {
  deleteUploadedPostImage,
  extractPostImageStoragePath,
  uploadPostImage,
} from '@/services/postStorage';
import { PHOTO_POST_CAPTION_MAX_LENGTH } from '@/constants/business-media';
import { getCurrentUserBusiness } from '@/services/businesses';
import type { BusinessRow } from '@/types/supabase-business';
import type { BusinessPost, PostRow, PostType } from '@/types/supabase-post';
import { getCurrentSession } from '@/utils/auth';
import { ANNOUNCEMENT_FIELD_LIMITS } from '@/constants/announcement-create';
import { buildAnnouncementCaption } from '@/utils/announcement-form';

export type PostErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'no_image'
  | 'empty_announcement'
  | 'invalid_post'
  | 'network'
  | 'upload_failed'
  | 'insert_failed'
  | 'update_failed'
  | 'delete_failed'
  | 'not_found'
  | 'unexpected';

export type PublishPhotoPostResult =
  | { ok: true; post: BusinessPost }
  | { ok: false; code: PostErrorCode; message: string };

export type PublishAnnouncementResult =
  | { ok: true; post: BusinessPost }
  | { ok: false; code: PostErrorCode; message: string };

export type GetBusinessPostsResult =
  | { ok: true; posts: BusinessPost[] }
  | { ok: false; code: PostErrorCode; message: string };

export type ListOwnerPostsResult =
  | { ok: true; posts: BusinessPost[] }
  | { ok: false; code: PostErrorCode; message: string };

export type GetOwnerPostResult =
  | { ok: true; post: BusinessPost }
  | { ok: false; code: PostErrorCode; message: string };

export type MutateOwnerPostResult =
  | { ok: true; post?: BusinessPost }
  | { ok: false; code: PostErrorCode; message: string };

export type UpdateOwnerPostResult =
  | { ok: true; post: BusinessPost }
  | { ok: false; code: PostErrorCode; message: string };

const POST_SELECT =
  'id, business_id, caption, image_url, post_type, status, created_at, updated_at';

const ANNOUNCEMENT_CAPTION_MAX_LENGTH = 1000;

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
    case 'empty_announcement':
      return 'Write an announcement before publishing.';
    case 'network':
      return 'Check your connection and try again.';
    case 'upload_failed':
      return "We couldn't upload your photo. Please try again.";
    case 'insert_failed':
      return "We couldn't publish your post. Please try again.";
    case 'invalid_post':
      return 'Check your post details and try again.';
    case 'update_failed':
      return "We couldn't save your post changes. Please try again.";
    case 'delete_failed':
      return "We couldn't delete this post. Please try again.";
    case 'not_found':
      return 'This post could not be found.';
    default:
      return "We couldn't publish your post. Please try again.";
  }
}

function validatePhotoCaptionForUpdate(caption: string): string | null {
  const trimmed = caption.trim();
  if (trimmed.length > PHOTO_POST_CAPTION_MAX_LENGTH) {
    return `Caption must be ${PHOTO_POST_CAPTION_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

function announcementUserFacingError(code: PostErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to publish.';
    case 'not_verified':
      return 'Your business must be verified before publishing announcements.';
    case 'empty_announcement':
      return 'Write an announcement before publishing.';
    case 'network':
      return 'Check your connection and try again.';
    case 'insert_failed':
      return "We couldn't publish your announcement. Please try again.";
    default:
      return "We couldn't publish your announcement. Please try again.";
  }
}

function resolvePostType(row: PostRow): PostType {
  return row.post_type === 'announcement' ? 'announcement' : 'photo';
}

function postRowToBusinessPost(row: PostRow): BusinessPost | null {
  const postType = resolvePostType(row);

  if (postType === 'photo' && !row.image_url) {
    return null;
  }

  if (postType === 'announcement') {
    const caption = row.caption?.trim();
    if (!caption) {
      return null;
    }
  }

  return {
    id: row.id,
    businessId: row.business_id,
    postType,
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

function validateAnnouncementText(title: string, message: string): string | null {
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();

  if (!trimmedTitle || !trimmedMessage) {
    return announcementUserFacingError('empty_announcement');
  }

  if (
    trimmedTitle.length > ANNOUNCEMENT_FIELD_LIMITS.title ||
    trimmedMessage.length > ANNOUNCEMENT_FIELD_LIMITS.message
  ) {
    return announcementUserFacingError('empty_announcement');
  }

  const caption = buildAnnouncementCaption(trimmedTitle, trimmedMessage);
  if (caption.length > ANNOUNCEMENT_CAPTION_MAX_LENGTH) {
    return announcementUserFacingError('empty_announcement');
  }

  return null;
}

export async function publishAnnouncement(params: {
  title: string;
  message: string;
}): Promise<PublishAnnouncementResult> {
  const validationMessage = validateAnnouncementText(params.title, params.message);
  if (validationMessage) {
    return {
      ok: false,
      code: 'empty_announcement',
      message: validationMessage,
    };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return {
      ok: false,
      code: verified.code,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? announcementUserFacingError(verified.code)
          : verified.message,
    };
  }

  const { business } = verified;
  const caption = buildAnnouncementCaption(params.title, params.message);

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        business_id: business.id,
        caption,
        image_url: null,
        post_type: 'announcement',
        status: 'published',
      })
      .select(POST_SELECT)
      .single();

    if (error) {
      logDevError('publishAnnouncement.insert', error);
      const code: PostErrorCode = isNetworkError(error) ? 'network' : 'insert_failed';
      return {
        ok: false,
        code,
        message: announcementUserFacingError(code),
      };
    }

    const post = postRowToBusinessPost(data as PostRow);
    if (!post) {
      return {
        ok: false,
        code: 'insert_failed',
        message: announcementUserFacingError('insert_failed'),
      };
    }

    return { ok: true, post };
  } catch (error) {
    logDevError('publishAnnouncement', error);
    const code = isNetworkError(error) ? 'network' : 'insert_failed';
    return {
      ok: false,
      code,
      message: announcementUserFacingError(code),
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

  const captionError = validatePhotoCaptionForUpdate(params.caption ?? '');
  if (captionError) {
    return {
      ok: false,
      code: 'invalid_post',
      message: captionError,
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
        post_type: 'photo',
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

export async function listOwnerPosts(): Promise<ListOwnerPostsResult> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return verified;
  }

  return getBusinessPosts(verified.business.id);
}

export async function getOwnerPostById(postId: string): Promise<GetOwnerPostResult> {
  const trimmedId = postId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return verified;
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('id', trimmedId)
      .eq('business_id', verified.business.id)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      logDevError('getOwnerPostById', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: userFacingError('unexpected'),
      };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    const post = postRowToBusinessPost(data as PostRow);
    if (!post) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    return { ok: true, post };
  } catch (error) {
    logDevError('getOwnerPostById', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError('unexpected'),
    };
  }
}

export async function updateOwnerPhotoPostCaption(
  postId: string,
  caption: string,
): Promise<UpdateOwnerPostResult> {
  const trimmedId = postId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const captionError = validatePhotoCaptionForUpdate(caption);
  if (captionError) {
    return { ok: false, code: 'invalid_post', message: captionError };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return verified;
  }

  const existing = await getOwnerPostById(trimmedId);
  if (!existing.ok) {
    return existing;
  }

  if (existing.post.postType !== 'photo') {
    return {
      ok: false,
      code: 'invalid_post',
      message: 'Only photo post captions can be edited here.',
    };
  }

  const normalizedCaption = caption.trim();
  const captionValue = normalizedCaption.length > 0 ? normalizedCaption : null;

  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ caption: captionValue })
      .eq('id', trimmedId)
      .eq('business_id', verified.business.id)
      .eq('post_type', 'photo')
      .select(POST_SELECT)
      .single();

    if (error) {
      logDevError('updateOwnerPhotoPostCaption', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'update_failed',
        message: userFacingError('update_failed'),
      };
    }

    const post = postRowToBusinessPost(data as PostRow);
    if (!post) {
      return {
        ok: false,
        code: 'update_failed',
        message: userFacingError('update_failed'),
      };
    }

    return { ok: true, post };
  } catch (error) {
    logDevError('updateOwnerPhotoPostCaption', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError('update_failed'),
    };
  }
}

export async function updateOwnerAnnouncementPost(
  postId: string,
  params: { title: string; message: string },
): Promise<UpdateOwnerPostResult> {
  const trimmedId = postId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const validationMessage = validateAnnouncementText(params.title, params.message);
  if (validationMessage) {
    return {
      ok: false,
      code: 'empty_announcement',
      message: validationMessage,
    };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return verified;
  }

  const existing = await getOwnerPostById(trimmedId);
  if (!existing.ok) {
    return existing;
  }

  if (existing.post.postType !== 'announcement') {
    return {
      ok: false,
      code: 'invalid_post',
      message: 'Only announcements can be edited here.',
    };
  }

  const caption = buildAnnouncementCaption(params.title, params.message);

  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ caption })
      .eq('id', trimmedId)
      .eq('business_id', verified.business.id)
      .eq('post_type', 'announcement')
      .select(POST_SELECT)
      .single();

    if (error) {
      logDevError('updateOwnerAnnouncementPost', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'update_failed',
        message: userFacingError('update_failed'),
      };
    }

    const post = postRowToBusinessPost(data as PostRow);
    if (!post) {
      return {
        ok: false,
        code: 'update_failed',
        message: userFacingError('update_failed'),
      };
    }

    return { ok: true, post };
  } catch (error) {
    logDevError('updateOwnerAnnouncementPost', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'update_failed',
      message: userFacingError('update_failed'),
    };
  }
}

export async function deleteOwnerPost(postId: string): Promise<MutateOwnerPostResult> {
  const trimmedId = postId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    return verified;
  }

  const existing = await getOwnerPostById(trimmedId);
  if (!existing.ok) {
    return existing;
  }

  const imagePath =
    existing.post.postType === 'photo'
      ? extractPostImageStoragePath(existing.post.imageUrl)
      : null;

  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', trimmedId)
      .eq('business_id', verified.business.id);

    if (error) {
      logDevError('deleteOwnerPost', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'delete_failed',
        message: userFacingError('delete_failed'),
      };
    }

    if (imagePath) {
      await deleteUploadedPostImage(imagePath);
    }

    return { ok: true };
  } catch (error) {
    logDevError('deleteOwnerPost', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'delete_failed',
      message: userFacingError('delete_failed'),
    };
  }
}
