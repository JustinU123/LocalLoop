import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { useAccountMode } from '@/contexts/account-mode-context';

export function useVerifiedBusinessCreateGuard() {
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const allowed = canAccessBusinessDashboard && activeAppMode === 'business';
    if (allowed) {
      return;
    }

    Alert.alert(
      'Verification required',
      'Business verification is required to create content.',
      [
        {
          text: 'OK',
          onPress: () => {
            if (canAccessBusinessDashboard) {
              router.replace('/(business-tabs)/create');
              return;
            }
            router.replace('/settings');
          },
        },
      ],
      { cancelable: false },
    );
  }, [isReady, canAccessBusinessDashboard, activeAppMode]);
}

export function useCanCreateBusinessContent(): boolean {
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();
  return isReady && canAccessBusinessDashboard && activeAppMode === 'business';
}
