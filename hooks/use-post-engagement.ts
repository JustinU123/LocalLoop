import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPostsEngagementCounts, getUserLikedPostIds, likePost, unlikePost } from '@/services/postEngagement';

export type PostEngagementCounts = {
  likeCount: number;
  commentCount: number;
};

export type UsePostEngagementResult = {
  /** True only until the first successful load for the current post id set. */
  loading: boolean;
  failed: boolean;
  hasLoaded: boolean;
  refresh: (options?: { background?: boolean }) => Promise<void>;
  getCounts: (postId: string) => PostEngagementCounts;
  isLiked: (postId: string) => boolean;
  toggleLike: (postId: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  setCommentCount: (postId: string, commentCount: number) => void;
};

function normalizePostIds(postIds: string[]): string[] {
  return [...new Set(postIds.map((id) => id.trim()).filter(Boolean))].sort();
}

export function usePostEngagement(postIds: string[]): UsePostEngagementResult {
  const idsKey = normalizePostIds(postIds).join(',');
  const normalizedIds = useMemo(
    () => (idsKey ? idsKey.split(',') : []),
    [idsKey],
  );

  const [countsByPostId, setCountsByPostId] = useState<Record<string, PostEngagementCounts>>({});
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(normalizedIds.length > 0);
  const [failed, setFailed] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const inflightGenerationRef = useRef(0);
  const loadedIdsKeyRef = useRef<string | null>(null);

  const refresh = useCallback(
    async (options?: { background?: boolean }) => {
      const ids = idsKey ? idsKey.split(',') : [];
      if (ids.length === 0) {
        setCountsByPostId({});
        setLikedPostIds(new Set());
        setLoading(false);
        setFailed(false);
        setHasLoaded(true);
        loadedIdsKeyRef.current = idsKey;
        return;
      }

      const background = options?.background ?? loadedIdsKeyRef.current === idsKey;
      if (!background) {
        setLoading(true);
      }
      setFailed(false);

      const generation = ++inflightGenerationRef.current;

      const [countsResult, likedResult] = await Promise.all([
        getPostsEngagementCounts(ids),
        getUserLikedPostIds(ids),
      ]);

      if (generation !== inflightGenerationRef.current) {
        return;
      }

      if (!countsResult.ok) {
        setFailed(true);
        setLoading(false);
        return;
      }

      const nextCounts: Record<string, PostEngagementCounts> = {};
      for (const id of ids) {
        const row = countsResult.counts[id];
        nextCounts[id] = {
          likeCount: row?.likeCount ?? 0,
          commentCount: row?.commentCount ?? 0,
        };
      }

      setCountsByPostId(nextCounts);
      setLikedPostIds(likedResult.ok ? likedResult.likedPostIds : new Set());
      loadedIdsKeyRef.current = idsKey;
      setHasLoaded(true);
      setLoading(false);
    },
    [idsKey],
  );

  useEffect(() => {
    loadedIdsKeyRef.current = null;
    /* eslint-disable react-hooks/set-state-in-effect -- reset when post id set changes */
    setHasLoaded(false);
    if (idsKey.length > 0) {
      setLoading(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    void refresh();
  }, [idsKey, refresh]);

  const getCounts = useCallback(
    (postId: string): PostEngagementCounts => {
      return countsByPostId[postId] ?? { likeCount: 0, commentCount: 0 };
    },
    [countsByPostId],
  );

  const isLiked = useCallback(
    (postId: string) => likedPostIds.has(postId),
    [likedPostIds],
  );

  const setCommentCount = useCallback((postId: string, commentCount: number) => {
    setCountsByPostId((current) => {
      const previous = current[postId] ?? { likeCount: 0, commentCount: 0 };
      return {
        ...current,
        [postId]: {
          ...previous,
          commentCount: Math.max(0, commentCount),
        },
      };
    });
  }, []);

  const toggleLike = useCallback(
    async (postId: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      const trimmedId = postId.trim();
      if (!trimmedId) {
        return { ok: false, message: 'Invalid post.' };
      }

      const wasLiked = likedPostIds.has(trimmedId);
      const previous = countsByPostId[trimmedId] ?? { likeCount: 0, commentCount: 0 };

      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) {
          next.delete(trimmedId);
        } else {
          next.add(trimmedId);
        }
        return next;
      });
      setCountsByPostId((current) => ({
        ...current,
        [trimmedId]: {
          ...previous,
          likeCount: wasLiked ? Math.max(0, previous.likeCount - 1) : previous.likeCount + 1,
        },
      }));

      const result = wasLiked ? await unlikePost(trimmedId) : await likePost(trimmedId);

      if (!result.ok) {
        setLikedPostIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) {
            next.add(trimmedId);
          } else {
            next.delete(trimmedId);
          }
          return next;
        });
        setCountsByPostId((current) => ({
          ...current,
          [trimmedId]: previous,
        }));

        const message =
          result.code === 'unauthenticated'
            ? 'Sign in to like posts.'
            : result.code === 'forbidden'
              ? 'You cannot like this post.'
              : 'Please try again in a moment.';

        return { ok: false, message };
      }

      return { ok: true };
    },
    [likedPostIds, countsByPostId],
  );

  return {
    loading,
    failed,
    hasLoaded,
    refresh,
    getCounts,
    isLiked,
    toggleLike,
    setCommentCount,
  };
}
