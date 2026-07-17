import { useEffect } from 'react';
import { router } from 'expo-router';

import { useAccountMode } from '@/contexts/account-mode-context';

export function useConsumerTabGuard() {
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (canAccessBusinessDashboard && activeAppMode === 'business') {
      router.replace('/(business-tabs)');
    }
  }, [isReady, canAccessBusinessDashboard, activeAppMode]);
}

export function useBusinessTabGuard() {
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!canAccessBusinessDashboard || activeAppMode !== 'business') {
      router.replace('/(tabs)');
    }
  }, [isReady, canAccessBusinessDashboard, activeAppMode]);
}
