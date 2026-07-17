import type { AccountType } from '@/utils/account-type';
import type { AccountMode, VerificationStatus } from '@/types/account-mode';

export const ACCOUNT_EXPERIENCE = {
  explorer: {
    title: 'Local Explorer',
    choosePrompt: 'Choose account type',
  },
  business: {
    title: 'Business Owner',
  },
} as const;

export function isExplorerAccountType(accountType: AccountType | null): boolean {
  return accountType === 'explorer' || accountType === 'consumer';
}

export function getAccountExperienceLabel(
  accountType: AccountType | null,
  verificationStatus: VerificationStatus,
): string {
  if (accountType === 'business' || verificationStatus !== 'not_submitted') {
    return ACCOUNT_EXPERIENCE.business.title;
  }

  if (isExplorerAccountType(accountType)) {
    return ACCOUNT_EXPERIENCE.explorer.title;
  }

  return ACCOUNT_EXPERIENCE.explorer.choosePrompt;
}

export function getVerificationStatusLabel(status: VerificationStatus): string | null {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'verified':
      return 'Verified';
    case 'needs_information':
      return 'Needs Information';
    case 'rejected':
      return 'Rejected';
    default:
      return null;
  }
}

export function resolveAccountMode(
  accountType: AccountType | null,
  verificationStatus: VerificationStatus,
): AccountMode {
  if (verificationStatus === 'verified') {
    return 'business_verified';
  }

  if (accountType === 'business' || verificationStatus === 'pending' || verificationStatus === 'needs_information') {
    return 'business_pending';
  }

  return 'explorer';
}
