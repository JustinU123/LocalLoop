import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { AnalyticsIntelligenceFocus, AnalyticsSegmentId } from '@/types/analytics-segments';

type AnalyticsNavigationContextValue = {
  activeSegment: AnalyticsSegmentId;
  setActiveSegment: (segment: AnalyticsSegmentId) => void;
  intelligenceFocus: AnalyticsIntelligenceFocus;
  goToIntelligence: (focus?: AnalyticsIntelligenceFocus) => void;
  consumeIntelligenceFocus: () => AnalyticsIntelligenceFocus;
};

const AnalyticsNavigationContext = createContext<AnalyticsNavigationContextValue | null>(null);

type AnalyticsNavigationProviderProps = {
  initialSegment?: AnalyticsSegmentId;
  children: ReactNode;
};

export function AnalyticsNavigationProvider({
  initialSegment = 'overview',
  children,
}: AnalyticsNavigationProviderProps) {
  const [activeSegment, setActiveSegment] = useState<AnalyticsSegmentId>(initialSegment);
  const [intelligenceFocus, setIntelligenceFocus] = useState<AnalyticsIntelligenceFocus>(null);

  const goToIntelligence = useCallback((focus: AnalyticsIntelligenceFocus = null) => {
    setIntelligenceFocus(focus);
    setActiveSegment('intelligence');
  }, []);

  const consumeIntelligenceFocus = useCallback(() => {
    const focus = intelligenceFocus;
    setIntelligenceFocus(null);
    return focus;
  }, [intelligenceFocus]);

  const value = useMemo(
    () => ({
      activeSegment,
      setActiveSegment,
      intelligenceFocus,
      goToIntelligence,
      consumeIntelligenceFocus,
    }),
    [activeSegment, intelligenceFocus, goToIntelligence, consumeIntelligenceFocus],
  );

  return (
    <AnalyticsNavigationContext.Provider value={value}>{children}</AnalyticsNavigationContext.Provider>
  );
}

export function useAnalyticsNavigation(): AnalyticsNavigationContextValue {
  const ctx = useContext(AnalyticsNavigationContext);
  if (!ctx) {
    throw new Error('useAnalyticsNavigation must be used within AnalyticsNavigationProvider');
  }
  return ctx;
}
