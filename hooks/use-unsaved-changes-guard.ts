import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export type UseUnsavedChangesGuardOptions = {
  isDirty: boolean;
  title: string;
  message?: string;
  /** Called when the user confirms discard (draft cleanup, etc.). */
  onDiscard: () => void;
  /** Called when leaving without unsaved changes (optional screen-specific cleanup). */
  onLeaveWithoutSaving?: () => void;
};

/** After confirm: run custom navigation, or null to router.back(). */
type PendingNavigation = (() => void) | null;

export function useUnsavedChangesGuard({
  isDirty,
  title,
  message,
  onDiscard,
  onLeaveWithoutSaving,
}: UseUnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const allowNavigationRef = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);
  const pendingNavigationRef = useRef<PendingNavigation | undefined>(undefined);

  const onDiscardRef = useRef(onDiscard);
  const onLeaveWithoutSavingRef = useRef(onLeaveWithoutSaving);

  useEffect(() => {
    onDiscardRef.current = onDiscard;
    onLeaveWithoutSavingRef.current = onLeaveWithoutSaving;
  });

  const runPendingNavigation = useCallback((pending: PendingNavigation) => {
    if (pending) {
      pending();
    } else {
      router.back();
    }
  }, []);

  const confirmDiscard = useCallback(() => {
    allowNavigationRef.current = true;
    onDiscardRef.current();
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = undefined;
    setModalVisible(false);
    runPendingNavigation(pending ?? null);
  }, [runPendingNavigation]);

  const dismissModal = useCallback(() => {
    pendingNavigationRef.current = undefined;
    setModalVisible(false);
  }, []);

  const requestLeave = useCallback(
    (pendingNavigation?: PendingNavigation) => {
      if (allowNavigationRef.current || !isDirty) {
        if (!allowNavigationRef.current) {
          onLeaveWithoutSavingRef.current?.();
        }
        runPendingNavigation(pendingNavigation ?? null);
        return;
      }

      pendingNavigationRef.current = pendingNavigation ?? null;
      setModalVisible(true);
    },
    [isDirty, runPendingNavigation],
  );

  const attemptBack = useCallback(() => {
    requestLeave(null);
  }, [requestLeave]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowNavigationRef.current || !isDirty) {
        return;
      }

      event.preventDefault();
      pendingNavigationRef.current = () => {
        navigation.dispatch(event.data.action);
      };
      setModalVisible(true);
    });

    return unsubscribe;
  }, [navigation, isDirty]);

  return {
    attemptBack,
    discardModalProps: {
      visible: modalVisible,
      title,
      message,
      onKeepEditing: dismissModal,
      onDiscard: confirmDiscard,
    },
  };
}
