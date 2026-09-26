import { useCallback, useState } from 'react';

import { getBusinessFollowerCount } from '@/services/businessFollows';
import { getBusinessPostEngagementForOwner } from '@/services/postEngagementAnalytics';
import { getBusinessPosts } from '@/services/posts';
import type { BusinessPostEngagementSummary } from '@/types/post-engagement';
import type { BusinessPost } from '@/types/supabase-post';

export type BasicAnalyticsLoadState = 'idle' | 'loading' | 'ready' | 'error';

export type BasicAnalyticsData = {
  loadState: BasicAnalyticsLoadState;
  totalFollowers: number | null;
  followersFailed: boolean;
  posts: BusinessPost[];
  postsFailed: boolean;
  engagement: BusinessPostEngagementSummary | null;
  engagementFailed: boolean;
  refresh: () => Promise<void>;
};

export function useBasicAnalyticsData(businessId: string | undefined): BasicAnalyticsData {
  const [loadState, setLoadState] = useState<BasicAnalyticsLoadState>('idle');
  const [totalFollowers, setTotalFollowers] = useState<number | null>(null);
  const [followersFailed, setFollowersFailed] = useState(false);
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [postsFailed, setPostsFailed] = useState(false);
  const [engagement, setEngagement] = useState<BusinessPostEngagementSummary | null>(null);
  const [engagementFailed, setEngagementFailed] = useState(false);

  const refresh = useCallback(async () => {
    const trimmedId = businessId?.trim();
    if (!trimmedId) {
      setLoadState('ready');
      setTotalFollowers(null);
      setPosts([]);
      setEngagement(null);
      return;
    }

    setLoadState('loading');
    setFollowersFailed(false);
    setPostsFailed(false);
    setEngagementFailed(false);

    const [followersResult, postsResult, engagementResult] = await Promise.all([
      getBusinessFollowerCount(trimmedId),
      getBusinessPosts(trimmedId),
      getBusinessPostEngagementForOwner(trimmedId),
    ]);

    if (followersResult.ok) {
      setTotalFollowers(followersResult.count);
    } else {
      setFollowersFailed(true);
      setTotalFollowers(null);
    }

    if (postsResult.ok) {
      setPosts(postsResult.posts);
    } else {
      setPostsFailed(true);
      setPosts([]);
    }

    if (engagementResult.ok) {
      setEngagement(engagementResult.summary);
    } else {
      setEngagementFailed(true);
      setEngagement(null);
    }

    setLoadState('ready');
  }, [businessId]);

  return {
    loadState,
    totalFollowers,
    followersFailed,
    posts,
    postsFailed,
    engagement,
    engagementFailed,
    refresh,
  };
}
