import { Href, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppTheme } from '@/contexts/app-theme-context';
import { getCurrentUserBusiness, resolveVerificationStatus } from '@/services/businesses';
import { getAccountTypeFromMetadata } from '@/utils/account-type';
import { loadActiveAppMode } from '@/utils/app-mode-storage';
import { loadVerificationStatus } from '@/utils/account-mode-storage';
import { canAccessBusinessDashboardWithBusinessRow } from '@/utils/business-dashboard';
import { getCurrentSession } from '@/utils/auth';
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
          const storedVerificationStatus = await loadVerificationStatus(session.user.id);
          const { business } = await getCurrentUserBusiness();
          const verificationStatus = resolveVerificationStatus(business, storedVerificationStatus);
          const activeAppMode = await loadActiveAppMode(session.user.id);

          if (
            canAccessBusinessDashboardWithBusinessRow(business, accountType, verificationStatus) &&
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
