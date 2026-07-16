import { Href, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BusinessTheme as T } from '@/constants/business-theme';
import { getAccountTypeFromMetadata } from '@/utils/account-type';
import { getCurrentSession } from '@/utils/auth';
import { isOnboardingComplete } from '@/utils/onboarding-storage';

export default function Index() {
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
          setDestination('/(tabs)');
          return;
        }

        if (session && !onboardingComplete) {
          const accountType = getAccountTypeFromMetadata(session.user.user_metadata);

          if (accountType === 'consumer') {
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
      <View style={styles.loading}>
        <ActivityIndicator color={T.emerald} />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
