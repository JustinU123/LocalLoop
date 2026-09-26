import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import type { MenuSection } from '@/data/businesses';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type MenuSectionsListProps = {
  sections: MenuSection[];
};

export function MenuSectionsList({ sections }: MenuSectionsListProps) {
  const styles = useThemedStyles(createStyles);

  if (sections.length === 0) {
    return null;
  }

  return (
    <>
      {sections.map((section) => (
        <View key={section.title}>
          <View style={styles.menuSectionHeader}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
          </View>
          {section.items.map((item) => (
            <View key={item.id ?? `${section.title}-${item.name}`} style={styles.menuItem}>
              <View style={styles.menuItemHeader}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.menuItemImage} contentFit="cover" />
                ) : null}
                <View style={styles.menuItemText}>
                  <View style={styles.menuItemTitleRow}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemPrice}>{item.price}</Text>
                  </View>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    menuSectionHeader: {
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    menuSectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.2,
      marginBottom: 12,
    },
    menuItem: {
      backgroundColor: theme.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    menuItemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: theme.surfaceElevated,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
    },
    menuItemImage: {
      width: 72,
      height: 72,
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    menuItemText: {
      flex: 1,
      gap: 6,
    },
    menuItemTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    menuItemName: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
      flex: 1,
    },
    menuItemPrice: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.bold,
    },
    menuItemDescription: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: BrandFonts.regular,
    },
  });
}
