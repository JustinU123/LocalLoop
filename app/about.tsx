import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import {
  ABOUT_COPYRIGHT,
  ABOUT_MADE_IN,
  ABOUT_TAGLINE,
  APP_VERSION,
} from '@/constants/support';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { openSupportEmail } from '@/utils/support-email';

const FEATURES = [
  'Curated local discovery',
  'Photo and video posts from businesses',
  'Nearby promotions',
  'Location-based map',
  'Saved businesses, posts, and deals',
  'Business profiles and community reviews',
] as const;

const LINK_ROWS: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  alertTitle: string;
  alertMessage: string;
  action?: 'email';
}[] = [
  {
    id: 'website',
    label: 'Website',
    icon: 'globe-outline',
    alertTitle: 'Coming soon',
    alertMessage: "LocalLoop's website is coming soon.",
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'mail-outline',
    alertTitle: 'Contact LocalLoop',
    alertMessage: 'Open your email app to reach our team.',
    action: 'email',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    alertTitle: 'Coming soon',
    alertMessage: "LocalLoop's Instagram is coming soon.",
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: 'logo-tiktok',
    alertTitle: 'Coming soon',
    alertMessage: "LocalLoop's TikTok is coming soon.",
  },
];

export default function AboutScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const handleLinkPress = async (row: (typeof LINK_ROWS)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (row.action === 'email') {
      await openSupportEmail({
        subject: 'LocalLoop Inquiry',
        body: 'Hi LocalLoop team,\n\n',
      });
      return;
    }

    Alert.alert(row.alertTitle, row.alertMessage);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="About LocalLoop" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LocalLoopWordmark style={styles.wordmark} />

        <Text style={styles.headline}>{ABOUT_TAGLINE}</Text>
        <Text style={styles.description}>
          LocalLoop helps people discover independent businesses, local favorites, hidden gems,
          business posts, and nearby promotions without letting national chains dominate the
          experience.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our mission</Text>
          <Text style={styles.cardBody}>
            Our mission is to help people discover authentic local businesses while giving
            independent owners a better way to share their story, build a following, and reach
            nearby customers.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What you can do</Text>
          {FEATURES.map((feature, index) => (
            <View key={feature}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={theme.emerald} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
              {index < FEATURES.length - 1 ? <View style={styles.featureDivider} /> : null}
            </View>
          ))}
        </View>

        <Text style={styles.meta}>{ABOUT_MADE_IN}</Text>
        <Text style={styles.meta}>Version {APP_VERSION}</Text>
        <Text style={styles.meta}>{ABOUT_COPYRIGHT}</Text>

        <View style={styles.linksCard}>
          {LINK_ROWS.map((row, index) => (
            <View key={row.id}>
              <Pressable
                onPress={() => handleLinkPress(row)}
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
                <View style={styles.linkIconWrap}>
                  <Ionicons name={row.icon} size={18} color={theme.emerald} />
                </View>
                <Text style={styles.linkLabel}>{row.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
              {index < LINK_ROWS.length - 1 ? <View style={styles.linkDivider} /> : null}
            </View>
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
      paddingBottom: 40,
      gap: 14,
    },
    wordmark: {
      alignSelf: 'center',
      marginTop: 4,
    },
    headline: {
      color: theme.text,
      fontSize: 24,
      lineHeight: 30,
      textAlign: 'center',
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      textAlign: 'center',
      fontFamily: BrandFonts.regular,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
      ...theme.shadowCard,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    cardBody: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    featureText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    featureDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 28,
    },
    meta: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      fontFamily: BrandFonts.medium,
    },
    linksCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      marginTop: 6,
      ...theme.shadowCard,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    linkRowPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    linkIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkLabel: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.medium,
    },
    linkDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 52,
    },
  });
}
