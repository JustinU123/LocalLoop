import { Ionicons } from '@expo/vector-icons';
import type { User } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useNotifications } from '@/contexts/notifications-context';
import {
  useCanManageVerifiedBusinessProfile,
  useVerifiedBusinessCreateGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getCurrentSession, getDisplayNameFromUser } from '@/utils/auth';

function SectionLabel({
  label,
  styles,
}: {
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function GroupDivider({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.groupDivider} />;
}

function SettingsRow({
  icon,
  label,
  value,
  showChevron = false,
  badgeCount,
  comingSoon = false,
  destructive = false,
  onPress,
  disabled = false,
  loading = false,
  styles,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  showChevron?: boolean;
  badgeCount?: number;
  comingSoon?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  styles: ReturnType<typeof createStyles>;
  theme: AppThemeTokens;
}) {
  const iconColor = destructive ? theme.danger : theme.emerald;
  const labelColor = destructive ? theme.danger : theme.text;
  const rightText = comingSoon ? 'Coming soon' : value;
  const isInactive = disabled || comingSoon || loading || !onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && onPress && !isInactive && styles.settingsRowPressed,
        isInactive && styles.settingsRowDisabled,
      ]}>
      <View style={[styles.rowIconWrap, destructive && styles.rowIconWrapDestructive]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.rowTrailing}>
        {loading ? (
          <ActivityIndicator size="small" color={destructive ? theme.danger : theme.emerald} />
        ) : rightText ? (
          <Text
            style={[
              styles.rowValue,
              comingSoon && styles.rowValueMuted,
              destructive && styles.rowValueDestructive,
            ]}
            numberOfLines={1}>
            {rightText}
          </Text>
        ) : null}
        {badgeCount && badgeCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{badgeCount}</Text>
          </View>
        ) : null}
        {showChevron && !comingSoon ? (
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function BusinessSettingsScreen() {
  useVerifiedBusinessCreateGuard({
    blockedMessage: 'Business verification is required to open business settings.',
  });

  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const canEditProfile = useCanManageVerifiedBusinessProfile();
  const { verificationStatus, verificationStatusLabel, refreshAccountMode } = useAccountMode();
  const { unreadCount } = useNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const session = await getCurrentSession();
      setUser(session?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshAccountMode();
      void loadUser();
    }, [refreshAccountMode, loadUser]),
  );

  const navigateWithHaptic = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as never);
  };

  const openProfileSection = (path: string) => {
    if (!canEditProfile) {
      return;
    }
    navigateWithHaptic(path);
  };

  const openVerification = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (
      verificationStatus === 'pending' ||
      verificationStatus === 'verified' ||
      verificationStatus === 'needs_information' ||
      verificationStatus === 'rejected'
    ) {
      router.push('/business-verification-pending');
      return;
    }
    router.push('/business-verification');
  };

  const ownerDisplayName = user ? getDisplayNameFromUser(user) : loadingUser ? 'Loading…' : '—';
  const ownerEmail = user?.email ?? '—';

  const profileEditDisabled = !canEditProfile;
  const profileEditHint = canEditProfile ? undefined : 'Verify business';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Business Settings" onBackPress={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Manage your public business profile, account access, and preferences. Subscription billing
          will be added in a future release.
        </Text>

        <SectionLabel label="Business profile" styles={styles} />
        <View style={styles.groupCard}>
          <SettingsRow
            icon="storefront-outline"
            label="Edit Business Information"
            value={profileEditHint}
            showChevron={canEditProfile}
            disabled={profileEditDisabled}
            onPress={() => openProfileSection('/business-settings-profile-information')}
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="call-outline"
            label="Contact & Links"
            value={profileEditHint}
            showChevron={canEditProfile}
            disabled={profileEditDisabled}
            onPress={() => openProfileSection('/business-settings-profile-contact')}
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="location-outline"
            label="Location"
            value={profileEditHint}
            showChevron={canEditProfile}
            disabled={profileEditDisabled}
            onPress={() => openProfileSection('/business-settings-profile-location')}
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="time-outline"
            label="Business Hours"
            value={profileEditHint}
            showChevron={canEditProfile}
            disabled={profileEditDisabled}
            onPress={() => openProfileSection('/business-settings-hours')}
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="images-outline"
            label="Photos & Branding"
            value={profileEditHint}
            showChevron={canEditProfile}
            disabled={profileEditDisabled}
            onPress={() => openProfileSection('/business-settings-photos')}
            styles={styles}
            theme={theme}
          />
        </View>

        <SectionLabel label="Plan & billing" styles={styles} />
        <View style={styles.groupCard}>
          <SettingsRow
            icon="card-outline"
            label="Manage Subscription"
            comingSoon
            styles={styles}
            theme={theme}
          />
        </View>

        <SectionLabel label="Account & access" styles={styles} />
        <View style={styles.groupCard}>
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Verification"
            value={verificationStatusLabel ?? undefined}
            showChevron
            onPress={openVerification}
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="person-outline"
            label="Business Owner"
            value={loadingUser ? undefined : ownerEmail}
            showChevron
            onPress={() => navigateWithHaptic('/settings')}
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="people-outline"
            label="Team Members"
            comingSoon
            styles={styles}
            theme={theme}
          />
        </View>

        <SectionLabel label="Preferences" styles={styles} />
        <View style={styles.groupCard}>
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            showChevron
            badgeCount={unreadCount}
            onPress={() => navigateWithHaptic('/notifications')}
            styles={styles}
            theme={theme}
          />
        </View>

        <SectionLabel label="Danger zone" styles={styles} />
        <View style={styles.groupCard}>
          <SettingsRow
            icon="archive-outline"
            label="Archive Business"
            comingSoon
            destructive
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="trash-outline"
            label="Delete Business"
            comingSoon
            destructive
            styles={styles}
            theme={theme}
          />
        </View>

        <Text style={styles.footerNote}>Signed in as {ownerDisplayName}.</Text>
      </ScrollView>
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
      paddingBottom: 40,
      gap: 8,
    },
    intro: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      marginBottom: 8,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 16,
      marginBottom: 8,
    },
    groupCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    groupDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 52,
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      minHeight: 52,
    },
    settingsRowPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    settingsRowDisabled: {
      opacity: 0.72,
    },
    rowIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowIconWrapDestructive: {
      backgroundColor: 'rgba(224, 85, 85, 0.12)',
    },
    rowLabel: {
      flex: 1,
      fontSize: 16,
      fontFamily: BrandFonts.medium,
    },
    rowTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '46%',
    },
    rowValue: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
      textAlign: 'right',
      flexShrink: 1,
    },
    rowValueMuted: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
    rowValueDestructive: {
      color: theme.danger,
    },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    footerNote: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
      marginTop: 20,
      textAlign: 'center',
    },
  });
}
