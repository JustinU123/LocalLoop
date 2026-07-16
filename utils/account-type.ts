export type AccountType = 'consumer' | 'business';

export function isAccountType(value: unknown): value is AccountType {
  return value === 'consumer' || value === 'business';
}

export function getAccountTypeFromMetadata(metadata: Record<string, unknown> | undefined): AccountType | null {
  const accountType = metadata?.account_type;
  return isAccountType(accountType) ? accountType : null;
}
