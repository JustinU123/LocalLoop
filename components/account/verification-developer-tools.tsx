import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionHeader } from '@/components/account/section-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  devApproveVerification,
  devRejectVerification,
  devResetToExplorer,
  devSetPendingReview,
} from '@/utils/account-mode-dev';
import { testMapChainPlacesDiscovery } from '@/utils/test-map-chain-places';

type DevToolButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  styles: ReturnType<typeof createStyles>;
};

function DevToolButton({ label, onPress, loading = false, styles }: DevToolButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.devButton,
        loading && styles.devButtonDisabled,
        pressed && !loading && styles.devButtonPressed,
      ]}>
      <Text style={styles.devButtonLabel}>{loading ? 'Working…' : label}</Text>
    </Pressable>
  );
}

export function VerificationDeveloperTools() {
  if (!__DEV__) {
    return null;
  }

  const styles = useThemedStyles(createStyles);
  const { userId, refreshAccountMode } = useAccountMode();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const runAction = async (actionId: string, action: () => Promise<boolean>) => {
    if (!userId) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingAction(actionId);
    try {
      const success = await action();
      if (success) {
        await refreshAccountMode();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        label="Developer Tools"
        hint="Development only. These controls are hidden in production builds."
      />
      <View style={styles.buttonGroup}>
        <DevToolButton
          label="Approve Verification"
          loading={loadingAction === 'approve'}
          styles={styles}
          onPress={() =>
            runAction('approve', async () => {
              if (!userId) return false;
              return devApproveVerification(userId);
            })
          }
        />
        <DevToolButton
          label="Reject Verification"
          loading={loadingAction === 'reject'}
          styles={styles}
          onPress={() =>
            runAction('reject', async () => {
              if (!userId) return false;
              return devRejectVerification(userId);
            })
          }
        />
        <DevToolButton
          label="Pending Review"
          loading={loadingAction === 'pending'}
          styles={styles}
          onPress={() =>
            runAction('pending', async () => {
              if (!userId) return false;
              return devSetPendingReview(userId);
            })
          }
        />
        <DevToolButton
          label="Reset to Explorer"
          loading={loadingAction === 'reset'}
          styles={styles}
          onPress={() =>
            runAction('reset', async () => {
              if (!userId) return false;
              return devResetToExplorer(userId);
            })
          }
        />
        <DevToolButton
          label="Test Foursquare Chain Discovery"
          loading={loadingAction === 'chain-places'}
          styles={styles}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLoadingAction('chain-places');
            try {
              const result = await testMapChainPlacesDiscovery();
              return result.ok;
            } finally {
              setLoadingAction(null);
            }
          }}
        />
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      marginTop: 24,
      gap: 8,
    },
    buttonGroup: {
      gap: 8,
    },
    devButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
    },
    devButtonPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    devButtonDisabled: {
      opacity: 0.6,
    },
    devButtonLabel: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
