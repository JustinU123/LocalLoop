import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationRow } from '@/components/notifications/notification-row';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { AppNotification } from '@/data/notifications';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useNotifications, type NotificationSection } from '@/contexts/notifications-context';
import { getBusinessById } from '@/data/businesses';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { openBusinessProfile } from '@/utils/open-business-profile';

export default function NotificationsScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { sections, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAllAsRead();
  }, [markAllAsRead, unreadCount]);

  const handlePressNotification = useCallback(
    (notification: AppNotification) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markAsRead(notification.id);

      if (notification.businessId && getBusinessById(notification.businessId)) {
        openBusinessProfile(notification.businessId);
        return;
      }

      if (notification.businessId) {
        Alert.alert('Business profile coming soon', 'This business profile is not available yet.');
        return;
      }

      Alert.alert('Notification', notification.title);
    },
    [markAsRead],
  );

  const renderSection = useCallback(
    ({ item: section }: { item: NotificationSection }) => (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.groupCard}>
          {section.data.map((notification, index) => (
            <View key={notification.id}>
              <NotificationRow
                notification={notification}
                onPress={() => handlePressNotification(notification)}
              />
              {index < section.data.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </View>
    ),
    [handlePressNotification, styles],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          style={({ pressed }) => [
            styles.markAllButton,
            unreadCount === 0 && styles.markAllButtonDisabled,
            pressed && unreadCount > 0 && styles.markAllButtonPressed,
          ]}
          hitSlop={8}>
          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 && styles.markAllTextDisabled,
            ]}>
            Mark all as read
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(section) => section.group}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      paddingTop: 4,
      gap: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    markAllButton: {
      minWidth: 40,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    markAllButtonDisabled: {
      opacity: 0.45,
    },
    markAllButtonPressed: {
      opacity: 0.8,
    },
    markAllText: {
      color: theme.emerald,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    markAllTextDisabled: {
      color: theme.textSecondary,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 16,
    },
    sectionBlock: {
      gap: 8,
    },
    sectionTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    groupCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 72,
    },
  });
}
