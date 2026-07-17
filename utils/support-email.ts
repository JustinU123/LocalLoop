import { Alert, Linking } from 'react-native';

import { SUPPORT_EMAIL } from '@/constants/support';

type SupportEmailParams = {
  subject: string;
  body: string;
};

export async function openSupportEmail({ subject, body }: SupportEmailParams): Promise<boolean> {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        'Unable to open mail',
        `Please email us directly at ${SUPPORT_EMAIL}.`,
      );
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(
      'Unable to open mail',
      `Please email us directly at ${SUPPORT_EMAIL}.`,
    );
    return false;
  }
}
