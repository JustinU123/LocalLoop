import { useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useAccountMode } from '@/contexts/account-mode-context';

type VerifiedBusinessCreateGuardOptions = {
  blockedTitle?: string;
  blockedMessage?: string;
};

export function useVerifiedBusinessCreateGuard(options?: VerifiedBusinessCreateGuardOptions) {
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
      options?.blockedTitle ?? 'Verification required',
      options?.blockedMessage ?? 'Business verification is required to create content.',
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
  }, [
    isReady,
    canAccessBusinessDashboard,
    activeAppMode,
    options?.blockedTitle,
    options?.blockedMessage,
  ]);
}

export function useVerifiedBusinessPromotionGuard() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to create promotions.',
  });
}

export function useVerifiedBusinessEventGuard() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to create events.',
  });
}

export function useVerifiedBusinessProductItemGuard() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to create products or menu items.',
  });
}

export function useVerifiedBusinessAnnouncementGuard() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to create announcements.',
  });
}

export function useCanCreateBusinessContent(): boolean {
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();
  return isReady && canAccessBusinessDashboard && activeAppMode === 'business';
}
