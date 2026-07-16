import { Stack } from 'expo-router';

import { useAppTheme } from '@/contexts/app-theme-context';

export default function OnboardingLayout() {
  const { theme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: theme.bg },
      }}>
      <Stack.Screen name="splash" options={{ animation: 'none' }} />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="email" />
      <Stack.Screen name="account-type" />
      <Stack.Screen name="consumer" />
      <Stack.Screen name="business" />
    </Stack>
  );
}
