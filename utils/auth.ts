import { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { AccountType } from '@/utils/account-type';

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
