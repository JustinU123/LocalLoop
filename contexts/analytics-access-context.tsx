import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type { AnalyticsCapability, AnalyticsFeatureAccess, AnalyticsPlanTier } from '@/types/analytics-access';
import {
  getAnalyticsFeatureAccess,
  hasAnalyticsCapability,
} from '@/utils/analytics-access';
import {
  getAnalyticsEffectivePlanTier,
  subscribeAnalyticsEffectivePlanTier,
} from '@/utils/analytics-dev-tier-preview';

export type AnalyticsAccessContextValue = {
  tier: AnalyticsPlanTier;
  hasCapability: (capability: AnalyticsCapability) => boolean;
  getFeatureAccess: (capability: AnalyticsCapability) => AnalyticsFeatureAccess;
};

const AnalyticsAccessContext = createContext<AnalyticsAccessContextValue | null>(null);

type AnalyticsAccessProviderProps = {
  children: ReactNode;
};

function getServerAnalyticsPlanTier(): AnalyticsPlanTier {
  return 'basic';
}

export function AnalyticsAccessProvider({ children }: AnalyticsAccessProviderProps) {
  const tier = useSyncExternalStore(
    subscribeAnalyticsEffectivePlanTier,
    getAnalyticsEffectivePlanTier,
    getServerAnalyticsPlanTier,
  );

  const value = useMemo((): AnalyticsAccessContextValue => {
    return {
      tier,
      hasCapability: (capability: AnalyticsCapability) => hasAnalyticsCapability(tier, capability),
      getFeatureAccess: (capability: AnalyticsCapability) =>
        getAnalyticsFeatureAccess(tier, capability),
    };
  }, [tier]);

  return (
    <AnalyticsAccessContext.Provider value={value}>{children}</AnalyticsAccessContext.Provider>
  );
}

export function useAnalyticsAccessContext(): AnalyticsAccessContextValue {
  const context = useContext(AnalyticsAccessContext);
  if (!context) {
    throw new Error('useAnalyticsAccess must be used within AnalyticsAccessProvider');
  }
  return context;
}
