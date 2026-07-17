import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { LegalDocumentSection } from '@/components/account/legal-document-section';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { PRIVACY_POLICY_SECTIONS } from '@/constants/legal-content';
import { LEGAL_LAST_UPDATED } from '@/constants/support';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function PrivacyPolicyScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Privacy Policy" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            This draft is for app development and must be reviewed before public launch.
          </Text>
        </View>

        <Text style={styles.title}>Draft Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>

        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <LegalDocumentSection key={section.title} title={section.title} body={section.body} />
        ))}
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
    },
    noticeCard: {
      backgroundColor: theme.coralGlow,
      borderWidth: 1,
      borderColor: theme.coral,
      borderRadius: BrandRadius.md,
      padding: 12,
      marginBottom: 16,
    },
    noticeText: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: BrandFonts.medium,
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    updated: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
      marginBottom: 20,
    },
  });
}
