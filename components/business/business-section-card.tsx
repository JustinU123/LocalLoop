import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type ActivityRowProps = {
  message: string;
  unread?: boolean;
};

export function ActivityRow({ message, unread = false }: ActivityRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.row, unread && styles.rowUnread]}>
      {unread ? <View style={styles.unreadDot} /> : <View style={styles.readSpacer} />}
      <Text style={[styles.message, unread && styles.messageUnread]}>{message}</Text>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    rowUnread: {
      backgroundColor: theme.emeraldGlow,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.emerald,
      marginTop: 6,
    },
    readSpacer: {
      width: 8,
    },
    message: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    messageUnread: {
      color: theme.text,
      fontFamily: BrandFonts.semiBold,
    },
  });
}

export function BusinessSectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const styles = useThemedStyles(createSectionStyles);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function createSectionStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    section: {
      gap: 10,
    },
    title: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
  });
}

export function BusinessEmptyState({ message }: { message: string }) {
  const styles = useThemedStyles(createEmptyStyles);

  return (
    <View style={styles.empty}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function createEmptyStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    empty: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    text: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
    },
  });
}
