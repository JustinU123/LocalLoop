import { Alert } from 'react-native';

import type { VerificationStatus } from '@/types/account-mode';
import { clearBusinessApplicationData, saveVerificationStatus } from '@/utils/account-mode-storage';
import { saveActiveAppMode } from '@/utils/app-mode-storage';
import { updateUserAccountType } from '@/utils/auth';

function devGuard(): boolean {
  if (!__DEV__) {
    return false;
  }
  return true;
}

export async function devApproveVerification(userId: string): Promise<boolean> {
  if (!devGuard()) {
    return false;
  }

  const { error } = await updateUserAccountType('business');
  if (error) {
    Alert.alert('Dev tool failed', error.message);
    return false;
  }

  await saveVerificationStatus(userId, 'verified');
  return true;
}

export async function devRejectVerification(userId: string): Promise<boolean> {
  if (!devGuard()) {
    return false;
  }

  await saveVerificationStatus(userId, 'rejected');
  return true;
}

export async function devSetPendingReview(userId: string): Promise<boolean> {
  if (!devGuard()) {
    return false;
  }

  const { error } = await updateUserAccountType('business');
  if (error) {
    Alert.alert('Dev tool failed', error.message);
    return false;
  }

  await saveVerificationStatus(userId, 'pending');
  return true;
}

export async function devResetToExplorer(userId: string): Promise<boolean> {
  if (!devGuard()) {
    return false;
  }

  const { error } = await updateUserAccountType('explorer');
  if (error) {
    Alert.alert('Dev tool failed', error.message);
    return false;
  }

  await clearBusinessApplicationData(userId);
  await saveActiveAppMode(userId, 'explorer');
  return true;
}

export function getVerificationStatusHeadline(status: VerificationStatus): {
  badge: string;
  title: string;
  body: string;
} {
  switch (status) {
    case 'verified':
      return {
        badge: 'Verified',
        title: 'Business Verified',
        body: 'Your business has been approved. You can switch to the business dashboard when you are ready to manage your presence.',
      };
    case 'rejected':
      return {
        badge: 'Rejected',
        title: 'Verification Not Approved',
        body: 'Your business verification request was not approved. You can update your application and submit again for review.',
      };
    case 'needs_information':
      return {
        badge: 'Needs Information',
        title: 'More Information Needed',
        body: 'We need additional details before we can approve your business access request.',
      };
    case 'pending':
    default:
      return {
        badge: 'Pending Review',
        title: 'Business Verification Pending',
        body: 'Your business application has been submitted for review. Business tools will become available after your business is reviewed.',
      };
  }
}
