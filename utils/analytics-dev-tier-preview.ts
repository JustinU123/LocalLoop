import type { AnalyticsPlanTier } from '@/types/analytics-access';
import { resolveAnalyticsPlanTier } from '@/utils/analytics-access';

/**
 * In-memory dev override only. Never persisted; ignored outside __DEV__.
 * Remove when subscription entitlements ship.
 */
let devTierOverride: AnalyticsPlanTier | null = null;
const listeners = new Set<() => void>();

export function getAnalyticsDevTierOverride(): AnalyticsPlanTier | null {
  if (!__DEV__) {
    return null;
  }
  return devTierOverride;
}

export function setAnalyticsDevTierOverride(tier: AnalyticsPlanTier | null): void {
  if (!__DEV__) {
    return;
  }
  devTierOverride = tier;
  listeners.forEach((listener) => listener());
}

export function subscribeAnalyticsDevTierOverride(listener: () => void): () => void {
  if (!__DEV__) {
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Effective tier for UI and capability checks (subscription + dev override). */
export function getAnalyticsEffectivePlanTier(): AnalyticsPlanTier {
  return resolveAnalyticsPlanTier({
    devTierOverride: getAnalyticsDevTierOverride(),
  });
}

export function subscribeAnalyticsEffectivePlanTier(listener: () => void): () => void {
  return subscribeAnalyticsDevTierOverride(listener);
}
