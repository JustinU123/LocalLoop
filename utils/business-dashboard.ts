import type { AccountType } from '@/utils/account-type';
import type { VerificationStatus } from '@/types/account-mode';
import type { BusinessRow } from '@/types/supabase-business';

export function canAccessBusinessDashboard(
  accountType: AccountType | null,
  verificationStatus: VerificationStatus,
): boolean {
  return accountType === 'business' && verificationStatus === 'verified';
}

export function canAccessBusinessDashboardWithBusinessRow(
  business: BusinessRow | null,
  fallbackAccountType: AccountType | null,
  fallbackVerificationStatus: VerificationStatus,
): boolean {
  if (business) {
    return business.verification_status === 'verified';
  }

  return canAccessBusinessDashboard(fallbackAccountType, fallbackVerificationStatus);
}

export function getGreetingName(displayName: string): string {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${greeting}, ${displayName.split(' ')[0]}`;
}
