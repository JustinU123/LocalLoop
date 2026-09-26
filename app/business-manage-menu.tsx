import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { OwnerMenuItemManageCard } from '@/components/business/owner-menu-item-manage-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useVerifiedBusinessCreateGuard } from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  businessMenuItemToProductItemDraft,
  deleteOwnerMenuItem,
  listOwnerMenuItems,
} from '@/services/menuItems';
import type { BusinessMenuItem } from '@/types/supabase-menu-item';
import { beginMenuItemEdit, clearProductItemDraft } from '@/utils/product-item-form';

export default function BusinessManageMenuScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to manage products and menu items.',
  });

  const styles = useThemedStyles(createStyles);
  const [items, setItems] = useState<BusinessMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const loadItems = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setErrorMessage(null);

    const result = await listOwnerMenuItems();

    if (mode === 'initial') {
      setLoading(false);
    } else {
      setRefreshing(false);
    }

    if (!result.ok) {
      setItems([]);
      setErrorMessage(result.message);
      return;
    }

    setItems(result.items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems('initial');
    }, [loadItems]),
  );

  const handleAddItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearProductItemDraft();
    router.push('/business-create-product-item');
  };

  const handleEdit = (item: BusinessMenuItem) => {
    beginMenuItemEdit(item.id, businessMenuItemToProductItemDraft(item), item.imageUrl);
    router.push({
      pathname: '/business-create-product-item',
      params: { editId: item.id },
    });
  };

  const confirmDeleteItem = (item: BusinessMenuItem) => {
    Alert.alert(
      'Delete this item?',
      `“${item.name}” will be removed from your menu and its image will be deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyItemId(item.id);
              const result = await deleteOwnerMenuItem(item.id);
              setBusyItemId(null);

              if (!result.ok) {
                Alert.alert('Unable to delete item', result.message);
                return;
              }

              setItems((current) => current.filter((row) => row.id !== item.id));
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Manage Products & Menu" onBackPress={() => router.back()} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loader.color} />
          <Text style={styles.centeredText}>Loading your menu…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load menu</Text>
          <Text style={styles.centeredText}>{errorMessage}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadItems('refresh')} />
          }>
          <Pressable
            onPress={handleAddItem}
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </Pressable>

          {items.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>No menu items yet</Text>
              <Text style={styles.centeredText}>
                Add your first menu item with + Add Item, or use Create → New Product or Menu Item.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <OwnerMenuItemManageCard
                key={item.id}
                item={item}
                busy={busyItemId === item.id}
                onEdit={() => handleEdit(item)}
                onDelete={() => confirmDeleteItem(item)}
              />
            ))
          )}
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
      gap: 14,
    },
    addButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    addButtonPressed: {
      opacity: 0.9,
    },
    addButtonText: {
      color: theme.emerald,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    emptyBlock: {
      paddingTop: 24,
      gap: 8,
      alignItems: 'center',
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
