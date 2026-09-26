import {
  useAnalyticsAccessContext,
  type AnalyticsAccessContextValue,
} from '@/contexts/analytics-access-context';

export function useAnalyticsAccess(): AnalyticsAccessContextValue {
  return useAnalyticsAccessContext();
}

export type AnalyticsAccessContext = AnalyticsAccessContextValue;
