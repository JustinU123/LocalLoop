import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

export function openBusinessProfile(businessId: string) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(`/business/${businessId}`);
}
