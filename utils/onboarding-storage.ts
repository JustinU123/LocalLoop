import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = 'localloop_onboarding_complete';

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}
