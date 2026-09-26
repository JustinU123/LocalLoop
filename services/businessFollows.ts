import { supabase } from '@/lib/supabase';
import { getCurrentSession } from '@/utils/auth';

export type BusinessFollowsErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'network'
  | 'unexpected';

export type ListFollowedBusinessIdsResult =
  | { ok: true; businessIds: string[] }
  | { ok: false; code: BusinessFollowsErrorCode; message: string };

export type FollowMutationResult =
  | { ok: true }
  | { ok: false; code: BusinessFollowsErrorCode; message: string };

export type GetBusinessFollowerCountResult =
  | { ok: true; count: number }
  | { ok: false; code: BusinessFollowsErrorCode; message: string };

function logDevError(scope: string, error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error(`[businessFollows:${scope}]`, context ?? {}, error);
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

export async function listFollowedBusinessIdsForCurrentUser(): Promise<ListFollowedBusinessIdsResult> {
  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    if (!userId) {
      return { ok: true, businessIds: [] };
    }

    const { data, error } = await supabase
      .from('business_follows')
      .select('business_id')
      .eq('follower_user_id', userId);

    if (error) {
      logDevError('listFollowedBusinessIdsForCurrentUser', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load your followed businesses.',
      };
    }

    const businessIds = ((data as { business_id: string }[] | null) ?? []).map(
      (row) => row.business_id,
    );

    return { ok: true, businessIds };
  } catch (error) {
    logDevError('listFollowedBusinessIdsForCurrentUser', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load your followed businesses.',
    };
  }
}

export async function followBusiness(businessId: string): Promise<FollowMutationResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'unexpected', message: 'Invalid business.' };
  }

  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    if (!userId) {
      return { ok: false, code: 'unauthenticated', message: 'Sign in to follow businesses.' };
    }

    const { error } = await supabase.from('business_follows').insert({
      business_id: trimmedId,
      follower_user_id: userId,
    });

    if (error) {
      if (error.code === '23505') {
        return { ok: true };
      }

      logDevError('followBusiness', error, { businessId: trimmedId });
      const code =
        error.code === '42501'
          ? 'forbidden'
          : isNetworkError(error)
            ? 'network'
            : 'unexpected';
      return {
        ok: false,
        code,
        message:
          code === 'forbidden'
            ? 'You cannot follow this business.'
            : 'Unable to follow this business right now.',
      };
    }

    return { ok: true };
  } catch (error) {
    logDevError('followBusiness', error, { businessId: trimmedId });
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to follow this business right now.',
    };
  }
}

export async function unfollowBusiness(businessId: string): Promise<FollowMutationResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'unexpected', message: 'Invalid business.' };
  }

  try {
    const session = await getCurrentSession();
    const userId = session?.user?.id;
    if (!userId) {
      return { ok: false, code: 'unauthenticated', message: 'Sign in to manage follows.' };
    }

    const { error } = await supabase
      .from('business_follows')
      .delete()
      .eq('business_id', trimmedId)
      .eq('follower_user_id', userId);

    if (error) {
      logDevError('unfollowBusiness', error, { businessId: trimmedId });
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to unfollow this business right now.',
      };
    }

    return { ok: true };
  } catch (error) {
    logDevError('unfollowBusiness', error, { businessId: trimmedId });
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to unfollow this business right now.',
    };
  }
}

export async function getBusinessFollowerCount(
  businessId: string,
): Promise<GetBusinessFollowerCountResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { ok: true, count: 0 };
  }

  try {
    const { data, error } = await supabase.rpc('get_business_follower_count', {
      target_business_id: trimmedId,
    });

    if (error) {
      logDevError('getBusinessFollowerCount', error, { businessId: trimmedId });
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load follower count.',
      };
    }

    const numeric = typeof data === 'number' ? data : Number(data);
    const count = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;

    return { ok: true, count };
  } catch (error) {
    logDevError('getBusinessFollowerCount', error, { businessId: trimmedId });
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load follower count.',
    };
  }
}
