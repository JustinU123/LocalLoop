import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_ANALYTICS_TIME_RANGE_ID,
  type AnalyticsTimeRangeId,
} from '@/types/analytics-time-range';
import { getAnalyticsTimeRangeDefinition } from '@/utils/analytics-time-range';

type AnalyticsTimeRangeContextValue = {
  selectedRangeId: AnalyticsTimeRangeId;
  setSelectedRangeId: (id: AnalyticsTimeRangeId) => void;
  pillLabel: string;
};

const AnalyticsTimeRangeContext = createContext<AnalyticsTimeRangeContextValue | null>(null);

type AnalyticsTimeRangeProviderProps = {
  children: ReactNode;
};

export function AnalyticsTimeRangeProvider({ children }: AnalyticsTimeRangeProviderProps) {
  const [selectedRangeId, setSelectedRangeId] =
    useState<AnalyticsTimeRangeId>(DEFAULT_ANALYTICS_TIME_RANGE_ID);

  const pillLabel = useMemo(
    () => getAnalyticsTimeRangeDefinition(selectedRangeId).pillLabel,
    [selectedRangeId],
  );

  const value = useMemo(
    () => ({
      selectedRangeId,
      setSelectedRangeId,
      pillLabel,
    }),
    [selectedRangeId, pillLabel],
  );

  return (
    <AnalyticsTimeRangeContext.Provider value={value}>{children}</AnalyticsTimeRangeContext.Provider>
  );
}

export function useAnalyticsTimeRange(): AnalyticsTimeRangeContextValue {
  const context = useContext(AnalyticsTimeRangeContext);
  if (!context) {
    throw new Error('useAnalyticsTimeRange must be used within AnalyticsTimeRangeProvider');
  }
  return context;
}
