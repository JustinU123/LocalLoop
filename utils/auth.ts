import { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { AccountType, getAccountTypeFromMetadata } from '@/utils/account-type';

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export async function updateUserAccountType(accountType: AccountType) {
  return supabase.auth.updateUser({
    data: { account_type: accountType },
  });
}

export function getAuthenticatedUser(user: User | null | undefined): User | null {
  return user ?? null;
}

export function getDisplayNameFromUser(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;

  for (const key of ['display_name', 'full_name', 'name'] as const) {
    const value = metadata?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const email = user.email?.trim();
  if (email) {
    const [localPart] = email.split('@');
    if (localPart) {
      return localPart;
    }
  }

  return 'LocalLoop member';
}

export function getAccountTypeLabel(accountType: AccountType | null): string | null {
  if (accountType === 'explorer' || accountType === 'consumer') {
    return 'Local Explorer';
  }
  if (accountType === 'business') {
    return 'Business Owner';
  }
  return null;
}

export function getUserAccountType(user: User | null): AccountType | null {
  if (!user) {
    return null;
  }
  return getAccountTypeFromMetadata(user.user_metadata as Record<string, unknown> | undefined);
}
