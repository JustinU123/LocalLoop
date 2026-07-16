import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#080808' },
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
