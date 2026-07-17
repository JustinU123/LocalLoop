import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import {
  BUSINESS_CREATE_OPTIONS,
  CREATE_OPTION_MESSAGES,
  type BusinessCreateOptionId,
} from '@/constants/business-dashboard';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { useEffect } from 'react';

export default function CreateOptionScreen() {
  const styles = useThemedStyles(createStyles);
  const { type } = useLocalSearchParams<{ type?: string }>();
  const option = BUSINESS_CREATE_OPTIONS.find((item) => item.id === type);
  const optionId = (option?.id ?? 'photo-post') as BusinessCreateOptionId;

  useEffect(() => {
    Alert.alert('Coming soon', CREATE_OPTION_MESSAGES[optionId]);
  }, [optionId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={option?.title ?? 'Create'} />
      <View style={styles.content}>
        <Text style={styles.body}>{CREATE_OPTION_MESSAGES[optionId]}</Text>
      </View>
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
    },
    body: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
  });
}
