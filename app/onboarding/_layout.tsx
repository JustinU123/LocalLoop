import { Stack } from 'expo-router';

import { Brand } from '@/constants/business-theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: Brand.bg },
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
