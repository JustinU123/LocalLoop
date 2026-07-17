import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BusinessApplication, VerificationStatus } from '@/types/account-mode';

const VERIFICATION_STATUS_PREFIX = 'localloop:verification-status:';
const BUSINESS_APPLICATION_PREFIX = 'localloop:business-application:';

function verificationKey(userId: string) {
  return `${VERIFICATION_STATUS_PREFIX}${userId}`;
}

function applicationKey(userId: string) {
  return `${BUSINESS_APPLICATION_PREFIX}${userId}`;
}

export async function loadVerificationStatus(userId: string): Promise<VerificationStatus> {
  const value = await AsyncStorage.getItem(verificationKey(userId));
  if (
    value === 'pending' ||
    value === 'verified' ||
    value === 'needs_information' ||
    value === 'rejected'
  ) {
    return value;
  }
  return 'not_submitted';
}

export async function saveVerificationStatus(
  userId: string,
  status: VerificationStatus,
): Promise<void> {
  if (status === 'not_submitted') {
    await AsyncStorage.removeItem(verificationKey(userId));
    return;
  }
  await AsyncStorage.setItem(verificationKey(userId), status);
}

export async function loadBusinessApplication(
  userId: string,
): Promise<BusinessApplication | null> {
  const raw = await AsyncStorage.getItem(applicationKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BusinessApplication;
  } catch {
    return null;
  }
}

export async function saveBusinessApplication(
  userId: string,
  application: BusinessApplication,
): Promise<void> {
  await AsyncStorage.setItem(applicationKey(userId), JSON.stringify(application));
}

export async function clearBusinessApplicationData(userId: string): Promise<void> {
  await AsyncStorage.multiRemove([verificationKey(userId), applicationKey(userId)]);
}
