import type { AnalyticsCapability } from '@/types/analytics-access';

type HasCapability = (capability: AnalyticsCapability) => boolean;

export function usesPremiumAnalyticsPanels(hasCapability: HasCapability): boolean {
  return hasCapability('analytics.competitive_intelligence');
}

export function usesProAnalyticsPanels(hasCapability: HasCapability): boolean {
  return hasCapability('analytics.performance') && !usesPremiumAnalyticsPanels(hasCapability);
}

/** Basic-only dashboard Weekly Snapshot (Pro/Premium have performance-tier signature features). */
export function showBasicWeeklySnapshot(hasCapability: HasCapability): boolean {
  return !hasCapability('analytics.performance');
}
