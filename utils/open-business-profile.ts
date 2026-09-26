import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import type { PublicProfileTab } from '@/types/public-profile-tab';

type OpenBusinessProfileContext = {
  postId?: string;
  source?: string;
  tab?: PublicProfileTab;
};

export function openBusinessProfile(
  businessId: string,
  context?: OpenBusinessProfileContext,
) {
  const trimmedBusinessId = businessId.trim();

  if (__DEV__) {
    console.info('[openBusinessProfile]', {
      businessId: trimmedBusinessId,
      postId: context?.postId,
      source: context?.source,
      tab: context?.tab,
    });
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push({
    pathname: '/business/[id]',
    params: {
      id: trimmedBusinessId,
      ...(context?.tab ? { tab: context.tab } : {}),
    },
  });
}
