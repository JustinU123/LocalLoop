import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateOptionCard } from '@/components/business/create-option-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { BUSINESS_CREATE_OPTIONS } from '@/constants/business-dashboard';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function BusinessCreateScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.subtitle}>
          Choose what you want to publish for your business. Creation tools will connect in a future
          update.
        </Text>

        <View style={styles.options}>
          {BUSINESS_CREATE_OPTIONS.map((option) => (
            <CreateOptionCard
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              onPress={() => {
                if (option.id === 'photo-post') {
                  router.push('/business-create-photo');
                  return;
                }
                if (option.id === 'video-post') {
                  router.push('/business-create-video');
                  return;
                }
                router.push({
                  pathname: '/create-option',
                  params: { type: option.id },
                });
              }}
            />
          ))}
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
    content: {
      paddingHorizontal: 20,
      paddingBottom: 120,
      gap: 16,
    },
    title: {
      color: theme.text,
      fontSize: 34,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.8,
      marginTop: 4,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    options: {
      gap: 12,
    },
  });
}
