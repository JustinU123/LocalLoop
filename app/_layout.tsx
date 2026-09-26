import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AccountModeProvider } from '@/contexts/account-mode-context';
import { AppThemeProvider, useAppTheme } from '@/contexts/app-theme-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
import { LocationSettingsProvider } from '@/contexts/location-settings-context';
import { FollowedBusinessesProvider } from '@/contexts/followed-businesses-context';
import { SavedItemsProvider } from '@/contexts/saved-items-context';

function RootNavigation() {
  const { theme, isReady } = useAppTheme();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const navigationTheme = theme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.bg,
          card: theme.surface,
          border: theme.border,
          text: theme.text,
          primary: theme.emerald,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.bg,
          card: theme.surface,
          border: theme.border,
          text: theme.text,
          primary: theme.emerald,
        },
      };

  if (!isReady || !fontsLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.emerald} />
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(business-tabs)" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-edit-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="business-settings-profile-information"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="business-settings-profile-contact"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="business-settings-profile-location"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="business-settings-hours" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="business-settings-photos"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="current-mode" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-option" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-create-photo" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-create-video" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-media-preview" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-create-promotion" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-promotion-preview" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-manage-promotions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-manage-events" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-manage-posts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-manage-menu" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-edit-post" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-edit-promotion" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-create-event" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-event-preview" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-create-product-item" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-product-item-preview" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-create-announcement" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-announcement-preview" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account-type" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-verification" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-verification-pending" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="location" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="help-support" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="report-problem" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="request-business" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms-of-service" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="map" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="post/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business/review/[businessId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <SavedItemsProvider>
        <LocationSettingsProvider>
          <FollowedBusinessesProvider>
            <AccountModeProvider>
              <NotificationsProvider>
                <RootNavigation />
              </NotificationsProvider>
            </AccountModeProvider>
          </FollowedBusinessesProvider>
        </LocationSettingsProvider>
      </SavedItemsProvider>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
