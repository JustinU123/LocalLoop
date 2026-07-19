import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { VerificationDeveloperTools } from '@/components/account/verification-developer-tools';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getVerificationStatusHeadline } from '@/utils/account-mode-dev';

export default function BusinessVerificationPendingScreen() {
  const styles = useThemedStyles(createStyles);
  const { verificationStatus, refreshAccountMode, switchToBusinessDashboard, isReady } =
    useAccountMode();
  const headline = getVerificationStatusHeadline(verificationStatus);
  const isVerified = verificationStatus === 'verified';

  useFocusEffect(
    useCallback(() => {
      void refreshAccountMode();
    }, [refreshAccountMode]),
  );

  const handleSwitchToDashboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void switchToBusinessDashboard();
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title="Business Verification" />
        <View style={styles.loadingState}>
          <ActivityIndicator color={styles.loadingIndicator.color} />
          <Text style={styles.loadingText}>Loading your application status…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Business Verification" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View
          style={[
            styles.badge,
            verificationStatus === 'verified' && styles.badgeVerified,
            verificationStatus === 'rejected' && styles.badgeRejected,
            verificationStatus === 'needs_information' && styles.badgeNeedsInfo,
          ]}>
          <Text
            style={[
              styles.badgeText,
              verificationStatus === 'verified' && styles.badgeTextVerified,
              verificationStatus === 'rejected' && styles.badgeTextRejected,
              verificationStatus === 'needs_information' && styles.badgeTextNeedsInfo,
            ]}>
            {headline.badge}
          </Text>
        </View>

        <Text style={styles.title}>{headline.title}</Text>
        <Text style={styles.body}>{headline.body}</Text>

        <View style={styles.actions}>
          {isVerified ? (
            <PrimaryButton label="Switch to Business Dashboard" onPress={handleSwitchToDashboard} />
          ) : null}
          <PrimaryButton
            label="Return to Account"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/settings');
            }}
          />
          {verificationStatus !== 'verified' ? (
            <PrimaryButton
              label="Edit Application"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/business-verification');
              }}
            />
          ) : null}
        </View>

        <VerificationDeveloperTools />
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
      paddingTop: 24,
      paddingBottom: 40,
      gap: 14,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.coralGlow,
      borderWidth: 1,
      borderColor: theme.coral,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    badgeVerified: {
      backgroundColor: theme.emeraldGlow,
      borderColor: theme.emerald,
    },
    badgeRejected: {
      backgroundColor: 'rgba(224, 85, 85, 0.12)',
      borderColor: theme.danger,
    },
    badgeNeedsInfo: {
      backgroundColor: theme.coralGlow,
      borderColor: theme.coral,
    },
    badgeText: {
      color: theme.coral,
      fontSize: 12,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    badgeTextVerified: {
      color: theme.emerald,
    },
    badgeTextRejected: {
      color: theme.danger,
    },
    badgeTextNeedsInfo: {
      color: theme.coral,
    },
    title: {
      color: theme.text,
      fontSize: 26,
      lineHeight: 32,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
    },
    body: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      fontFamily: BrandFonts.regular,
    },
    actions: {
      marginTop: 12,
      gap: 12,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 24,
    },
    loadingIndicator: {
      color: theme.emerald,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
