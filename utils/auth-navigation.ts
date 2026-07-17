import { router } from 'expo-router';

import { User } from '@supabase/supabase-js';

import { AccountType, getAccountTypeFromMetadata } from '@/utils/account-type';
import { isOnboardingComplete } from '@/utils/onboarding-storage';

export async function routeAfterAuthentication(user: User | null) {
  const onboardingComplete = await isOnboardingComplete();

  if (onboardingComplete) {
    router.replace('/(tabs)');
    return;
  }

  const accountType = getAccountTypeFromMetadata(user?.user_metadata);

  if (accountType === 'consumer' || accountType === 'explorer') {
    router.replace('/onboarding/consumer');
    return;
  }

  if (accountType === 'business') {
    router.replace('/onboarding/business');
    return;
  }

  router.replace('/onboarding/account-type');
}

export function getOnboardingRouteForAccountType(accountType: AccountType) {
  return accountType === 'consumer' || accountType === 'explorer'
    ? '/onboarding/consumer'
    : '/onboarding/business';
}
