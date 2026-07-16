import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemePreference } from '@/constants/business-theme';

const THEME_PREFERENCE_KEY = 'localloop_theme_preference';

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const value = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
  } catch {
    // fall through to default
  }
  return 'light';
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
}
