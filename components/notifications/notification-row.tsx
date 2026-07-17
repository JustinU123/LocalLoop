import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { AppNotification } from '@/data/notifications';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type NotificationRowProps = {
  notification: AppNotification;
  onPress: () => void;
};

function getTypeAccent(type: AppNotification['type'], theme: AppThemeTokens) {
  if (type === 'new_promotion') {
    return theme.coral;
  }
  return theme.emerald;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const accent = getTypeAccent(notification.type, theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !notification.read && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.avatarWrap}>
        <Image
          source={{ uri: notification.businessLogo }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        {!notification.read ? <View style={[styles.unreadDot, { backgroundColor: accent }]} /> : null}
      </View>

      <View style={styles.content}>
        <Text style={[styles.businessName, !notification.read && styles.textUnread]}>
          {notification.businessName}
        </Text>
        <Text style={[styles.title, !notification.read && styles.textUnread]} numberOfLines={2}>
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>{notification.timeLabel}</Text>
      </View>

      {notification.thumbnail ? (
        <Image
          source={{ uri: notification.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.typeIconWrap, { backgroundColor: `${accent}22` }]}>
          <Ionicons
            name={
              notification.type === 'new_promotion'
                ? 'pricetag-outline'
                : notification.type === 'review_reply'
                  ? 'chatbubble-ellipses-outline'
                  : notification.type === 'event'
                    ? 'calendar-outline'
                    : notification.type === 'follow_activity'
                      ? 'people-outline'
                      : 'notifications-outline'
            }
            size={18}
            color={accent}
          />
        </View>
      )}
    </Pressable>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.surface,
    },
    rowUnread: {
      backgroundColor: theme.emeraldGlow,
    },
    rowPressed: {
      opacity: 0.9,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
    },
    unreadDot: {
      position: 'absolute',
      top: -1,
      right: -1,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: theme.surface,
    },
    content: {
      flex: 1,
      gap: 3,
    },
    businessName: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 0.2,
    },
    title: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
    },
    textUnread: {
      color: theme.text,
    },
    message: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 19,
      fontFamily: BrandFonts.regular,
    },
    time: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
      marginTop: 2,
    },
    thumbnail: {
      width: 52,
      height: 52,
      borderRadius: BrandRadius.sm,
      backgroundColor: theme.surfaceElevated,
    },
    typeIconWrap: {
      width: 52,
      height: 52,
      borderRadius: BrandRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
