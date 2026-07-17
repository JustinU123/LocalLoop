import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { APP_NAME, APP_VERSION } from '@/constants/support';

export function getAppInfo(currentRoute?: string) {
  return {
    appName: APP_NAME,
    version: Constants.expoConfig?.version ?? APP_VERSION,
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    route: currentRoute ?? 'unknown',
  };
}

export function formatAppInfoBlock(currentRoute?: string): string {
  const info = getAppInfo(currentRoute);
  return [
    `App: ${info.appName}`,
    `Version: ${info.version}`,
    `Platform: ${info.platform}`,
    `OS Version: ${info.osVersion}`,
    `Screen: ${info.route}`,
  ].join('\n');
}
