import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { useAccountMode } from '@/contexts/account-mode-context';

type VerifiedBusinessCreateGuardOptions = {
  blockedTitle?: string;
  blockedMessage?: string;
  /** When false, only verified-business access is required (e.g. profile edit from Account). */
  requireBusinessMode?: boolean;
};

export function useVerifiedBusinessCreateGuard(options?: VerifiedBusinessCreateGuardOptions) {
  const { isReady, canAccessBusinessDashboard, activeAppMode } = useAccountMode();
  const requireBusinessMode = options?.requireBusinessMode !== false;

  useFocusEffect(
    useCallback(() => {
      if (!isReady) {
        return;
      }

      if (requireBusinessMode && activeAppMode !== 'business') {
        return;
      }

      if (canAccessBusinessDashboard) {
        return;
      }

      Alert.alert(
        options?.blockedTitle ?? 'Verification required',
        options?.blockedMessage ?? 'Business verification is required to create content.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ],
        { cancelable: false },
      );
    }, [
      isReady,
      canAccessBusinessDashboard,
      activeAppMode,
      requireBusinessMode,
      options?.blockedTitle,
      options?.blockedMessage,
    ]),
  );
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

export function useCanManageVerifiedBusinessProfile(): boolean {
  const { isReady, canAccessBusinessDashboard, verificationStatus } = useAccountMode();
  return isReady && canAccessBusinessDashboard && verificationStatus === 'verified';
}
