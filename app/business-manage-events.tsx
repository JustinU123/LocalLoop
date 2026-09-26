import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { OwnerEventManageCard } from '@/components/business/owner-event-manage-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useVerifiedBusinessCreateGuard } from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  archiveOwnerEvent,
  deleteOwnerEvent,
  listOwnerEvents,
  type OwnerManagedEvent,
} from '@/services/events';
import { beginEventEdit, getBusinessAddressLabel } from '@/utils/event-form';
import {
  ownerEventManageSectionTitle,
  type OwnerEventManageSection,
} from '@/utils/event-owner';

const SECTION_ORDER: OwnerEventManageSection[] = ['current', 'upcoming', 'ended'];

export default function BusinessManageEventsScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to manage events.',
  });

  const styles = useThemedStyles(createStyles);
  const { businessApplication } = useAccountMode();
  const businessAddress = getBusinessAddressLabel(businessApplication);

  const [events, setEvents] = useState<OwnerManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);

  const loadEvents = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setErrorMessage(null);

    const result = await listOwnerEvents();

    if (mode === 'initial') {
      setLoading(false);
    } else {
      setRefreshing(false);
    }

    if (!result.ok) {
      setEvents([]);
      setErrorMessage(result.message);
      return;
    }

    setEvents(result.events);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEvents('initial');
    }, [loadEvents]),
  );

  const grouped = useMemo(() => {
    const buckets: Record<OwnerEventManageSection, OwnerManagedEvent[]> = {
      current: [],
      upcoming: [],
      ended: [],
    };

    for (const event of events) {
      buckets[event.manageSection].push(event);
    }

    return buckets;
  }, [events]);

  const totalCount = events.length;

  const handleEdit = (event: OwnerManagedEvent) => {
    beginEventEdit(event.id, event.draft, event.imageUrl);
    router.push({
      pathname: '/business-create-event',
      params: { editId: event.id },
    });
  };

  const confirmCancelEvent = (event: OwnerManagedEvent) => {
    Alert.alert(
      'Cancel this event?',
      'Customers will no longer see this event on your public profile. It will appear under Ended events here.',
      [
        { text: 'Keep Event', style: 'cancel' },
        {
          text: 'Cancel Event',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyEventId(event.id);
              const result = await archiveOwnerEvent(event.id);
              setBusyEventId(null);

              if (!result.ok) {
                Alert.alert('Unable to cancel event', result.message);
                return;
              }

              await loadEvents('refresh');
            })();
          },
        },
      ],
    );
  };

  const confirmDeleteEvent = (event: OwnerManagedEvent) => {
    Alert.alert(
      'Delete this event?',
      'This permanently removes the event and its image. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyEventId(event.id);
              const result = await deleteOwnerEvent(event.id);
              setBusyEventId(null);

              if (!result.ok) {
                Alert.alert('Unable to delete event', result.message);
                return;
              }

              setEvents((current) => current.filter((item) => item.id !== event.id));
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Manage Events" onBackPress={() => router.back()} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loader.color} />
          <Text style={styles.centeredText}>Loading your events…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load events</Text>
          <Text style={styles.centeredText}>{errorMessage}</Text>
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.centeredText}>
            Publish an event from the Create tab to reach your community.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadEvents('refresh')} />
          }>
          {SECTION_ORDER.map((section) => {
            const items = grouped[section];
            if (items.length === 0) {
              return null;
            }

            return (
              <View key={section} style={styles.section}>
                <Text style={styles.sectionTitle}>{ownerEventManageSectionTitle(section)}</Text>
                {items.map((event) => {
                  const busy = busyEventId === event.id;
                  const canModify = event.manageSection !== 'ended';

                  return (
                    <OwnerEventManageCard
                      key={event.id}
                      event={event}
                      businessAddress={businessAddress}
                      busy={busy}
                      onEdit={canModify ? () => handleEdit(event) : undefined}
                      onCancel={canModify ? () => confirmCancelEvent(event) : undefined}
                      onDelete={() => confirmDeleteEvent(event)}
                    />
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      gap: 24,
    },
    section: {
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      gap: 10,
    },
    loader: {
      color: theme.emerald,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    errorTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      textAlign: 'center',
    },
    centeredText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
