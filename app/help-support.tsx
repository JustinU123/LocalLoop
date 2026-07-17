import * as Haptics from 'expo-haptics';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { FaqList } from '@/components/account/faq-item';
import { PrimaryButton } from '@/components/account/primary-button';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { HELP_FAQ_ITEMS } from '@/constants/help-faq';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { openSupportEmail } from '@/utils/support-email';

export default function HelpSupportScreen() {
  const styles = useThemedStyles(createStyles);

  const handleContactSupport = async () => {
    await openSupportEmail({
      subject: 'LocalLoop Support Request',
      body: 'Hi LocalLoop Support,\n\nI need help with:\n\n',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Help & Support" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Find answers and learn how to get the most out of LocalLoop.
        </Text>
        <FaqList items={HELP_FAQ_ITEMS} />
        <PrimaryButton label="Contact Support" onPress={handleContactSupport} />
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
      gap: 16,
    },
    intro: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
  });
}
