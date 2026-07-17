import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ActiveAppMode } from '@/types/app-navigation-mode';

const ACTIVE_APP_MODE_PREFIX = 'localloop:active-app-mode:';

function activeAppModeKey(userId: string) {
  return `${ACTIVE_APP_MODE_PREFIX}${userId}`;
}

export async function loadActiveAppMode(userId: string): Promise<ActiveAppMode> {
  const value = await AsyncStorage.getItem(activeAppModeKey(userId));
  return value === 'business' ? 'business' : 'explorer';
}

export async function saveActiveAppMode(userId: string, mode: ActiveAppMode): Promise<void> {
  await AsyncStorage.setItem(activeAppModeKey(userId), mode);
}

export async function clearActiveAppMode(userId: string): Promise<void> {
  await AsyncStorage.removeItem(activeAppModeKey(userId));
}
