import { Href, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppTheme } from '@/contexts/app-theme-context';
import { getAccountTypeFromMetadata } from '@/utils/account-type';
import { loadActiveAppMode } from '@/utils/app-mode-storage';
import { canAccessBusinessDashboard } from '@/utils/business-dashboard';
import { getCurrentSession } from '@/utils/auth';
import { loadVerificationStatus } from '@/utils/account-mode-storage';
import { isOnboardingComplete } from '@/utils/onboarding-storage';

export default function Index() {
  const { theme } = useAppTheme();
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState<Href>('/onboarding/splash');

  useEffect(() => {
    let mounted = true;

    async function resolveInitialRoute() {
      try {
        const [session, onboardingComplete] = await Promise.all([
          getCurrentSession(),
          isOnboardingComplete(),
        ]);

        if (!mounted) return;

        if (session && onboardingComplete) {
          const accountType = getAccountTypeFromMetadata(session.user.user_metadata);
          const verificationStatus = await loadVerificationStatus(session.user.id);
          const activeAppMode = await loadActiveAppMode(session.user.id);

          if (
            canAccessBusinessDashboard(accountType, verificationStatus) &&
            activeAppMode === 'business'
          ) {
            setDestination('/(business-tabs)');
            return;
          }

          setDestination('/(tabs)');
          return;
        }

        if (session && !onboardingComplete) {
          const accountType = getAccountTypeFromMetadata(session.user.user_metadata);

          if (accountType === 'consumer' || accountType === 'explorer') {
            setDestination('/onboarding/consumer');
            return;
          }

          if (accountType === 'business') {
            setDestination('/onboarding/business');
            return;
          }

          setDestination('/onboarding/account-type');
          return;
        }

        if (onboardingComplete) {
          setDestination('/onboarding/welcome');
          return;
        }

        setDestination('/onboarding/splash');
      } catch {
        if (mounted) {
          setDestination('/onboarding/splash');
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    resolveInitialRoute();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.emerald} />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
