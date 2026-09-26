import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import {
  businessRowToApplication,
  getCurrentUserBusiness,
  getCurrentUserProfile,
  resolveVerificationStatus,
  submitBusinessApplication as submitBusinessApplicationToSupabase,
} from '@/services/businesses';
import type { AccountMode, BusinessApplication, VerificationStatus } from '@/types/account-mode';
import type { BusinessRow } from '@/types/supabase-business';
import type { ActiveAppMode } from '@/types/app-navigation-mode';
import { ACTIVE_APP_MODE_LABELS } from '@/types/app-navigation-mode';
import {
  getAccountExperienceLabel,
  getVerificationStatusLabel,
  resolveAccountMode,
} from '@/utils/account-experience';
import {
  clearBusinessApplicationData,
  loadBusinessApplication,
  loadVerificationStatus,
  saveBusinessApplication,
  saveVerificationStatus,
} from '@/utils/account-mode-storage';
import { loadActiveAppMode, saveActiveAppMode } from '@/utils/app-mode-storage';
import { canAccessBusinessDashboardWithBusinessRow } from '@/utils/business-dashboard';
import type { AccountType } from '@/utils/account-type';
import { getAccountTypeFromMetadata } from '@/utils/account-type';
import { getCurrentSession, updateUserAccountType } from '@/utils/auth';

type AccountModeContextValue = {
  isReady: boolean;
  userId: string | null;
  accountType: AccountType | null;
  accountMode: AccountMode;
  verificationStatus: VerificationStatus;
  accountExperienceLabel: string;
  verificationStatusLabel: string | null;
  businessApplication: BusinessApplication | null;
  businessRecord: BusinessRow | null;
  activeAppMode: ActiveAppMode;
  currentModeLabel: string;
  canAccessBusinessDashboard: boolean;
  refreshAccountMode: () => Promise<void>;
  setLocalExplorerExperience: () => Promise<boolean>;
  submitBusinessApplication: (
    application: Omit<BusinessApplication, 'submittedAt'>,
  ) => Promise<boolean>;
  switchToExplorerMode: () => Promise<boolean>;
  switchToBusinessDashboard: () => Promise<boolean>;
};

const AccountModeContext = createContext<AccountModeContextValue | null>(null);

function resolveAccountType(
  profileAccountType: string | null | undefined,
  metadataAccountType: AccountType | null,
  hasBusinessRecord: boolean,
): AccountType | null {
  if (profileAccountType === 'business' || profileAccountType === 'explorer') {
    return profileAccountType;
  }

  if (metadataAccountType) {
    return metadataAccountType;
  }

  return hasBusinessRecord ? 'business' : metadataAccountType;
}

export function AccountModeProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_submitted');
  const [businessApplication, setBusinessApplication] = useState<BusinessApplication | null>(null);
  const [businessRecord, setBusinessRecord] = useState<BusinessRow | null>(null);
  const [activeAppMode, setActiveAppMode] = useState<ActiveAppMode>('explorer');

  const refreshAccountMode = useCallback(async () => {
    setIsReady(false);

    try {
      const session = await getCurrentSession();
      const nextUserId = session?.user?.id ?? null;
      setUserId(nextUserId);

      const metadataType = getAccountTypeFromMetadata(
        session?.user?.user_metadata as Record<string, unknown> | undefined,
      );

      if (!nextUserId) {
        setAccountType(null);
        setVerificationStatus('not_submitted');
        setBusinessApplication(null);
        setBusinessRecord(null);
        setActiveAppMode('explorer');
        return;
      }

      const [supabaseResult, storedStatus, storedApplication, storedAppMode, profile] =
        await Promise.all([
          getCurrentUserBusiness(),
          loadVerificationStatus(nextUserId),
          loadBusinessApplication(nextUserId),
          loadActiveAppMode(nextUserId),
          getCurrentUserProfile(nextUserId),
        ]);

      const nextBusinessRecord = supabaseResult.business;
      setBusinessRecord(nextBusinessRecord);

      const nextVerificationStatus = resolveVerificationStatus(nextBusinessRecord, storedStatus);
      setVerificationStatus(nextVerificationStatus);

      const nextAccountType = resolveAccountType(
        profile?.account_type,
        metadataType,
        Boolean(nextBusinessRecord),
      );
      setAccountType(nextAccountType);

      const nextApplication = nextBusinessRecord
        ? businessRowToApplication(nextBusinessRecord)
        : storedApplication;
      setBusinessApplication(nextApplication);

      if (nextBusinessRecord) {
        await saveVerificationStatus(nextUserId, nextVerificationStatus);
        if (nextApplication) {
          await saveBusinessApplication(nextUserId, nextApplication);
        }
      }

      const canUseBusiness = canAccessBusinessDashboardWithBusinessRow(
        nextBusinessRecord,
        nextAccountType,
        nextVerificationStatus,
      );
      const nextActiveAppMode =
        canUseBusiness && storedAppMode === 'business' ? 'business' : 'explorer';
      setActiveAppMode(nextActiveAppMode);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshAccountMode();
  }, [refreshAccountMode]);

  const canUseBusinessDashboard = useMemo(
    () =>
      canAccessBusinessDashboardWithBusinessRow(
        businessRecord,
        accountType,
        verificationStatus,
      ),
    [businessRecord, accountType, verificationStatus],
  );

  const persistActiveAppMode = useCallback(
    async (mode: ActiveAppMode) => {
      if (!userId) {
        return false;
      }
      await saveActiveAppMode(userId, mode);
      setActiveAppMode(mode);
      return true;
    },
    [userId],
  );

  const setLocalExplorerExperience = useCallback(async () => {
    const session = await getCurrentSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      Alert.alert('Sign in required', 'Please sign in to choose your LocalLoop experience.');
      return false;
    }

    const { error } = await updateUserAccountType('explorer');
    if (error) {
      Alert.alert('Unable to save account type', error.message);
      return false;
    }

    await clearBusinessApplicationData(currentUserId);
    await saveActiveAppMode(currentUserId, 'explorer');
    await refreshAccountMode();
    return true;
  }, [refreshAccountMode]);

  const submitBusinessApplication = useCallback(
    async (application: Omit<BusinessApplication, 'submittedAt'>) => {
      const session = await getCurrentSession();
      const currentUserId = session?.user?.id;
      if (!currentUserId) {
        Alert.alert(
          'Sign in required',
          'Please sign in again to submit your business application.',
        );
        return false;
      }

      const result = await submitBusinessApplicationToSupabase(application);
      if (!result.ok) {
        Alert.alert('Unable to submit', result.message);
        return false;
      }

      if (result.status === 'already_pending') {
        await refreshAccountMode();
        router.replace('/business-verification-pending');
        return true;
      }

      if (result.status === 'already_verified') {
        await refreshAccountMode();
        router.replace('/business-verification-pending');
        return true;
      }

      const { error } = await updateUserAccountType('business');
      if (error) {
        Alert.alert('Unable to save account type', error.message);
        return false;
      }

      const payload: BusinessApplication = {
        ...application,
        submittedAt: new Date().toISOString(),
      };

      await saveBusinessApplication(currentUserId, payload);
      await saveVerificationStatus(currentUserId, 'pending');
      await refreshAccountMode();

      return true;
    },
    [refreshAccountMode],
  );

  const switchToExplorerMode = useCallback(async () => {
    const saved = await persistActiveAppMode('explorer');
    if (!saved) {
      return false;
    }
    router.replace('/(tabs)');
    return true;
  }, [persistActiveAppMode]);

  const switchToBusinessDashboard = useCallback(async () => {
    if (!canUseBusinessDashboard) {
      Alert.alert(
        'Business access required',
        'Business Dashboard mode is available after your business is verified.',
      );
      return false;
    }

    const saved = await persistActiveAppMode('business');
    if (!saved) {
      return false;
    }
    router.replace('/(business-tabs)');
    return true;
  }, [canUseBusinessDashboard, persistActiveAppMode]);

  const accountMode = useMemo(
    () => resolveAccountMode(accountType, verificationStatus),
    [accountType, verificationStatus],
  );

  const accountExperienceLabel = useMemo(
    () => getAccountExperienceLabel(accountType, verificationStatus),
    [accountType, verificationStatus],
  );

  const verificationStatusLabel = useMemo(
    () => getVerificationStatusLabel(verificationStatus),
    [verificationStatus],
  );

  const currentModeLabel = ACTIVE_APP_MODE_LABELS[activeAppMode];

  const value = useMemo(
    () => ({
      isReady,
      userId,
      accountType,
      accountMode,
      verificationStatus,
      accountExperienceLabel,
      verificationStatusLabel,
      businessApplication,
      businessRecord,
      activeAppMode,
      currentModeLabel,
      canAccessBusinessDashboard: canUseBusinessDashboard,
      refreshAccountMode,
      setLocalExplorerExperience,
      submitBusinessApplication,
      switchToExplorerMode,
      switchToBusinessDashboard,
    }),
    [
      isReady,
      userId,
      accountType,
      accountMode,
      verificationStatus,
      accountExperienceLabel,
      verificationStatusLabel,
      businessApplication,
      businessRecord,
      activeAppMode,
      currentModeLabel,
      canUseBusinessDashboard,
      refreshAccountMode,
      setLocalExplorerExperience,
      submitBusinessApplication,
      switchToExplorerMode,
      switchToBusinessDashboard,
    ],
  );

  return <AccountModeContext.Provider value={value}>{children}</AccountModeContext.Provider>;
}

export function useAccountMode() {
  const context = useContext(AccountModeContext);
  if (!context) {
    throw new Error('useAccountMode must be used within AccountModeProvider');
  }
  return context;
}
