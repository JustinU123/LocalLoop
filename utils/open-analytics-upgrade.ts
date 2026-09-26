import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

/**
 * Central entry to the paid-plan comparison experience from Basic Analytics previews.
 * Route: /business-plans (placeholder until subscriptions ship).
 */
export function openAnalyticsUpgrade(source?: string) {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push({
    pathname: '/business-plans',
    params: source ? { source } : {},
  });
}
