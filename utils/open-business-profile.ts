import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

type OpenBusinessProfileContext = {
  postId?: string;
  source?: string;
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
    });
  }

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push({
    pathname: '/business/[id]',
    params: { id: trimmedBusinessId },
  });
}
