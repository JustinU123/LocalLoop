import * as Haptics from 'expo-haptics';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import {
  followBusiness,
  listFollowedBusinessIdsForCurrentUser,
  unfollowBusiness,
} from '@/services/businessFollows';

type FollowedBusinessesContextValue = {
  isFollowing: (businessId: string) => boolean;
  toggleFollow: (businessId: string) => Promise<boolean>;
  refreshFollows: () => Promise<void>;
  isHydrating: boolean;
};

const FollowedBusinessesContext = createContext<FollowedBusinessesContextValue | null>(null);

export function FollowedBusinessesProvider({ children }: { children: ReactNode }) {
  const [followedBusinessIds, setFollowedBusinessIds] = useState<Set<string>>(() => new Set());
  const [isHydrating, setIsHydrating] = useState(true);
  const followedRef = useRef(followedBusinessIds);

  useEffect(() => {
    followedRef.current = followedBusinessIds;
  }, [followedBusinessIds]);

  const refreshFollows = useCallback(async () => {
    setIsHydrating(true);
    try {
      const result = await listFollowedBusinessIdsForCurrentUser();
      if (result.ok) {
        setFollowedBusinessIds(new Set(result.businessIds));
      } else if (__DEV__) {
        console.error('[followedBusinesses:refreshFollows]', result.message);
      }
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    void refreshFollows();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void refreshFollows();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refreshFollows]);

  const isFollowing = useCallback(
    (businessId: string) => followedBusinessIds.has(businessId),
    [followedBusinessIds],
  );

  const toggleFollow = useCallback(async (businessId: string): Promise<boolean> => {
    const trimmedId = businessId.trim();
    if (!trimmedId) {
      return false;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const wasFollowing = followedRef.current.has(trimmedId);

    setFollowedBusinessIds((prev) => {
      const next = new Set(prev);
      if (wasFollowing) {
        next.delete(trimmedId);
      } else {
        next.add(trimmedId);
      }
      return next;
    });

    const result = wasFollowing
      ? await unfollowBusiness(trimmedId)
      : await followBusiness(trimmedId);

    if (!result.ok) {
      setFollowedBusinessIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) {
          next.add(trimmedId);
        } else {
          next.delete(trimmedId);
        }
        return next;
      });

      if (__DEV__) {
        console.error('[followedBusinesses:toggleFollow]', result.message);
      }

      return false;
    }

    return true;
  }, []);

  const value = useMemo(
    () => ({
      isFollowing,
      toggleFollow,
      refreshFollows,
      isHydrating,
    }),
    [isFollowing, toggleFollow, refreshFollows, isHydrating],
  );

  return (
    <FollowedBusinessesContext.Provider value={value}>{children}</FollowedBusinessesContext.Provider>
  );
}

export function useFollowedBusinesses() {
  const context = useContext(FollowedBusinessesContext);
  if (!context) {
    throw new Error('useFollowedBusinesses must be used within FollowedBusinessesProvider');
  }
  return context;
}
