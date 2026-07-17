import { Ionicons } from '@expo/vector-icons';
import type { User } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, type AppThemeTokens, type ThemePreference } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  getAccountTypeLabel,
  getCurrentSession,
  getDisplayNameFromUser,
  getUserAccountType,
  signOutUser,
} from '@/utils/auth';

const APPEARANCE_OPTIONS: {
  id: ThemePreference;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Bright surfaces with soft shadows',
    icon: 'sunny-outline',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Immersive dark surfaces with depth',
    icon: 'moon-outline',
  },
  {
    id: 'system',
    label: 'System',
    description: 'Match your device appearance',
    icon: 'phone-portrait-outline',
  },
];

function SectionLabel({ label, styles }: { label: string; styles: ReturnType<typeof createStyles> }) {
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

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || comingSoon || loading || !onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && onPress && !disabled && !comingSoon && styles.settingsRowPressed,
        (disabled || comingSoon) && styles.settingsRowDisabled,
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
        {showChevron ? (
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

function AppearanceOption({
  option,
  selected,
  onSelect,
  styles,
  theme,
}: {
  option: (typeof APPEARANCE_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppThemeTokens;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.optionCardPressed,
      ]}>
      <View style={[styles.optionIconWrap, selected && styles.optionIconWrapSelected]}>
        <Ionicons name={option.icon} size={22} color={selected ? theme.emerald : theme.textSecondary} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={theme.emerald} />
      ) : (
        <View style={styles.optionRadio} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme, preference, setPreference } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { unreadCount } = useNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

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

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSelectAppearance = async (next: ThemePreference) => {
    if (next === preference) return;
    Haptics.selectionAsync();
    await setPreference(next);
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSigningOut(true);

    try {
      const { error } = await signOutUser();
      if (error) {
        return;
      }
      router.replace('/onboarding/welcome');
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = user ? getDisplayNameFromUser(user) : '—';
  const email = user?.email ?? '—';
  const accountType = getUserAccountType(user);
  const accountTypeLabel = getAccountTypeLabel(accountType);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LocalLoopWordmark style={styles.headerWordmark} />

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {loadingUser ? (
              <ActivityIndicator color={theme.emerald} />
            ) : (
              <Ionicons name="person" size={34} color={theme.textSecondary} />
            )}
          </View>
          <Text style={styles.profileName}>{loadingUser ? 'Loading…' : displayName}</Text>
          <Text style={styles.profileEmail}>{loadingUser ? ' ' : email}</Text>
          {accountTypeLabel ? (
            <View style={styles.accountTypePill}>
              <Text style={styles.accountTypeText}>{accountTypeLabel}</Text>
            </View>
          ) : null}
          <Pressable disabled style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
            <Text style={styles.editProfileBadge}>Coming soon</Text>
          </Pressable>
        </View>

        <SectionLabel label="Account" styles={styles} />
        <View style={styles.groupCard}>
          <SettingsRow
            icon="mail-outline"
            label="Email"
            value={loadingUser ? undefined : email}
            styles={styles}
            theme={theme}
            disabled
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="person-circle-outline"
            label="Account Type"
            value={loadingUser ? undefined : accountTypeLabel ?? 'Not set'}
            styles={styles}
            theme={theme}
            disabled
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="log-out-outline"
            label="Sign Out"
            destructive
            onPress={handleSignOut}
            loading={signingOut}
            styles={styles}
            theme={theme}
          />
        </View>

        <SectionLabel label="Preferences" styles={styles} />
        <Text style={styles.sectionSubtitle}>Appearance</Text>
        <Text style={styles.sectionHint}>Choose how LocalLoop looks on your device.</Text>
        <View style={styles.options}>
          {APPEARANCE_OPTIONS.map((option) => (
            <AppearanceOption
              key={option.id}
              option={option}
              selected={preference === option.id}
              onSelect={() => handleSelectAppearance(option.id)}
              styles={styles}
              theme={theme}
            />
          ))}
        </View>

        <View style={[styles.groupCard, styles.groupCardSpaced]}>
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            showChevron
            badgeCount={unreadCount}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications');
            }}
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="location-outline"
            label="Location"
            comingSoon
            styles={styles}
            theme={theme}
          />
        </View>

        <SectionLabel label="Support" styles={styles} />
        <View style={styles.groupCard}>
          <SettingsRow
            icon="help-circle-outline"
            label="Help & Support"
            comingSoon
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="flag-outline"
            label="Report a Problem"
            comingSoon
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            comingSoon
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            comingSoon
            styles={styles}
            theme={theme}
          />
          <GroupDivider styles={styles} />
          <SettingsRow
            icon="information-circle-outline"
            label="About LocalLoop"
            value="Version 1.0.0"
            styles={styles}
            theme={theme}
            disabled
          />
        </View>
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
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingBottom: 12,
      paddingTop: 4,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center' as const,
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    headerWordmark: {
      marginBottom: 10,
    },
    profileCard: {
      alignItems: 'center' as const,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,
      marginBottom: 28,
      ...theme.shadowCard,
    },
    avatarWrap: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 14,
    },
    profileName: {
      color: theme.text,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    profileEmail: {
      color: theme.textSecondary,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
      marginBottom: 10,
    },
    accountTypePill: {
      backgroundColor: theme.coralGlow,
      borderWidth: 1,
      borderColor: theme.coral,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 16,
    },
    accountTypeText: {
      color: theme.coral,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 0.2,
    },
    editProfileButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      opacity: 0.72,
    },
    editProfileText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    editProfileBadge: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
      marginLeft: 4,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
      marginBottom: 8,
    },
    sectionSubtitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
      marginBottom: 4,
    },
    sectionHint: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      marginBottom: 14,
    },
    groupCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden' as const,
      ...theme.shadowCard,
    },
    groupCardSpaced: {
      marginTop: 16,
      marginBottom: 8,
    },
    groupDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 52,
    },
    settingsRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
      minHeight: 52,
    },
    settingsRowPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    settingsRowDisabled: {
      opacity: 1,
    },
    rowIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
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
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      maxWidth: '46%',
    },
    rowValue: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
      textAlign: 'right' as const,
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
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    unreadBadgeText: {
      color: theme.onEmerald,
      fontSize: 12,
      fontFamily: BrandFonts.bold,
    },
    options: {
      gap: 10,
      marginBottom: 8,
    },
    optionCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      ...theme.shadowCard,
    },
    optionCardSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    optionCardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    optionIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    optionIconWrapSelected: {
      backgroundColor: theme.bg,
    },
    optionText: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    optionDescription: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    optionRadio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
  });
}
