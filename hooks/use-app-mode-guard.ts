import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAccountMode } from '@/contexts/account-mode-context';

export function useConsumerTabGuard() {
  const segments = useSegments();
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();

  useEffect(() => {
    const inConsumerTabs = segments[0] === '(tabs)';

    if (!isReady || !inConsumerTabs) {
      return;
    }

    if (canAccessBusinessDashboard && activeAppMode === 'business') {
      router.replace('/(business-tabs)');
    }
  }, [isReady, canAccessBusinessDashboard, activeAppMode, segments]);
}

export function useBusinessTabGuard() {
  const segments = useSegments();
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();

  useEffect(() => {
    const inBusinessTabs = segments[0] === '(business-tabs)';

    if (!isReady || !inBusinessTabs) {
      return;
    }

    if (!canAccessBusinessDashboard || activeAppMode !== 'business') {
      router.replace('/(tabs)');
    }
  }, [isReady, canAccessBusinessDashboard, activeAppMode, segments]);
}
