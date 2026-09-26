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
import { OwnerPromotionManageCard } from '@/components/business/owner-promotion-manage-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useVerifiedBusinessCreateGuard } from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  archiveOwnerPromotion,
  deleteOwnerPromotion,
  listOwnerPromotions,
  type OwnerManagedPromotion,
} from '@/services/promotions';
import { beginPromotionEdit } from '@/utils/promotion-form';
import type { OwnerPromotionLifecycle } from '@/utils/promotion-owner';

const SECTION_ORDER: OwnerPromotionLifecycle[] = ['active', 'scheduled', 'ended'];

const SECTION_TITLES: Record<OwnerPromotionLifecycle, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  ended: 'Ended',
};

export default function BusinessManagePromotionsScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to manage promotions.',
  });

  const styles = useThemedStyles(createStyles);
  const [promotions, setPromotions] = useState<OwnerManagedPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyPromotionId, setBusyPromotionId] = useState<string | null>(null);

  const loadPromotions = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setErrorMessage(null);

    const result = await listOwnerPromotions();

    if (mode === 'initial') {
      setLoading(false);
    } else {
      setRefreshing(false);
    }

    if (!result.ok) {
      setPromotions([]);
      setErrorMessage(result.message);
      return;
    }

    setPromotions(result.promotions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPromotions('initial');
    }, [loadPromotions]),
  );

  const grouped = useMemo(() => {
    const buckets: Record<OwnerPromotionLifecycle, OwnerManagedPromotion[]> = {
      active: [],
      scheduled: [],
      ended: [],
    };

    for (const promotion of promotions) {
      buckets[promotion.lifecycle].push(promotion);
    }

    return buckets;
  }, [promotions]);

  const totalCount = promotions.length;

  const handleEdit = (promotion: OwnerManagedPromotion) => {
    beginPromotionEdit(promotion.id, promotion.draft, promotion.imageUrl);
    router.push({
      pathname: '/business-edit-promotion',
      params: { id: promotion.id },
    });
  };

  const confirmEndPromotion = (promotion: OwnerManagedPromotion) => {
    Alert.alert(
      'End this promotion?',
      'Customers will no longer see this offer. You can still find it under Ended promotions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Promotion',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyPromotionId(promotion.id);
              const result = await archiveOwnerPromotion(promotion.id);
              setBusyPromotionId(null);

              if (!result.ok) {
                Alert.alert('Unable to end promotion', result.message);
                return;
              }

              await loadPromotions('refresh');
            })();
          },
        },
      ],
    );
  };

  const confirmDeletePromotion = (promotion: OwnerManagedPromotion) => {
    Alert.alert(
      'Delete this promotion?',
      'This permanently removes the promotion and its image. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyPromotionId(promotion.id);
              const result = await deleteOwnerPromotion(promotion.id);
              setBusyPromotionId(null);

              if (!result.ok) {
                Alert.alert('Unable to delete promotion', result.message);
                return;
              }

              setPromotions((current) => current.filter((item) => item.id !== promotion.id));
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Manage Promotions" onBackPress={() => router.back()} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loader.color} />
          <Text style={styles.centeredText}>Loading your promotions…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load promotions</Text>
          <Text style={styles.centeredText}>{errorMessage}</Text>
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No promotions yet</Text>
          <Text style={styles.centeredText}>
            Publish a promotion from the Create tab to reach nearby customers.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadPromotions('refresh')} />
          }>
          {SECTION_ORDER.map((section) => {
            const items = grouped[section];
            if (items.length === 0) {
              return null;
            }

            return (
              <View key={section} style={styles.section}>
                <Text style={styles.sectionTitle}>{SECTION_TITLES[section]}</Text>
                {items.map((promotion) => {
                  const busy = busyPromotionId === promotion.id;
                  const showEdit = promotion.lifecycle === 'active' || promotion.lifecycle === 'scheduled';
                  const showEnd = promotion.lifecycle === 'active';

                  return (
                    <OwnerPromotionManageCard
                      key={promotion.id}
                      promotion={promotion}
                      busy={busy}
                      onEdit={showEdit ? () => handleEdit(promotion) : undefined}
                      onEnd={showEnd ? () => confirmEndPromotion(promotion) : undefined}
                      onDelete={() => confirmDeletePromotion(promotion)}
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
