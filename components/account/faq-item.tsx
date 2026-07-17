import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { FaqItem } from '@/constants/help-faq';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type FaqItemRowProps = {
  item: FaqItem;
  expanded: boolean;
  onToggle: () => void;
};

export function FaqItemRow({ item, expanded, onToggle }: FaqItemRowProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.header}>
        <Text style={styles.question}>{item.question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      </View>
      {expanded ? <Text style={styles.answer}>{item.answer}</Text> : null}
    </Pressable>
  );
}

export function FaqList({ items }: { items: FaqItem[] }) {
  const styles = useThemedStyles(createStyles);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={item.id}>
          <FaqItemRow
            item={item}
            expanded={expandedId === item.id}
            onToggle={() =>
              setExpandedId((current) => (current === item.id ? null : item.id))
            }
          />
          {index < items.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    list: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    row: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    rowPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    question: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      lineHeight: 21,
      fontFamily: BrandFonts.semiBold,
    },
    answer: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 16,
    },
  });
}
