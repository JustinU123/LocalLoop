import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { TimeFormField } from '@/components/business/time-form-field';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { DAY_OF_WEEK_LABELS } from '@/constants/business-hours';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { BusinessDayHours, BusinessHoursInterval, DayOfWeekKey } from '@/types/business-hours';
import { formatBusinessDayHoursSummary } from '@/utils/business-hours-display';

type BusinessDayHoursEditorProps = {
  day: DayOfWeekKey;
  value: BusinessDayHours;
  error?: string;
  onChange: (next: BusinessDayHours) => void;
};

export function BusinessDayHoursEditor({ day, value, error, onChange }: BusinessDayHoursEditorProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const summary = formatBusinessDayHoursSummary(value);
  const isClosed = value.closed;

  const handleToggleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      onChange({ closed: true, intervals: [] });
      return;
    }

    onChange({
      closed: false,
      intervals: value.intervals.length > 0 ? value.intervals : [{ open: '09:00', close: '17:00' }],
    });
  };

  const updateInterval = (
    index: number,
    patch: Partial<Pick<BusinessHoursInterval, 'open' | 'close'>>,
  ) => {
    const intervals = value.closed
      ? [{ open: '09:00', close: '17:00' }]
      : value.intervals.length > 0
        ? [...value.intervals]
        : [{ open: '09:00', close: '17:00' }];

    const current = intervals[index] ?? { open: '09:00', close: '17:00' };
    intervals[index] = {
      open: patch.open ?? current.open,
      close: patch.close ?? current.close,
    };

    onChange({ closed: false, intervals });
  };

  const addInterval = () => {
    const intervals = value.closed ? [] : [...value.intervals];
    intervals.push({ open: '11:00', close: '14:00' });
    onChange({ closed: false, intervals });
  };

  const removeInterval = (index: number) => {
    const intervals = value.intervals.filter((_, i) => i !== index);
    onChange({
      closed: false,
      intervals: intervals.length > 0 ? intervals : [{ open: '09:00', close: '17:00' }],
    });
  };

  const displayIntervals = value.closed
    ? []
    : value.intervals.length > 0
      ? value.intervals
      : [{ open: '09:00', close: '17:00' }];

  const showPeriodLabels = displayIntervals.length > 1;

  return (
    <View style={[styles.card, isClosed ? styles.cardClosed : styles.cardOpen]}>
      <View style={[styles.headerRow, isClosed && styles.headerRowClosed]}>
        <View style={styles.titleBlock}>
          <Text style={styles.dayLabel}>{DAY_OF_WEEK_LABELS[day]}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{value.closed ? 'Closed' : 'Open'}</Text>
          <Switch
            value={!value.closed}
            onValueChange={handleToggleOpen}
            trackColor={{ false: theme.border, true: theme.emerald }}
            thumbColor={theme.surface}
          />
        </View>
      </View>

      {!value.closed ? (
        <View style={styles.periods}>
          {displayIntervals.map((row, index) => (
            <View key={`${day}-${index}`} style={styles.periodBlock}>
              {showPeriodLabels ? (
                <View style={styles.periodHeader}>
                  <Text style={styles.periodTitle}>Period {index + 1}</Text>
                  <Pressable
                    onPress={() => removeInterval(index)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}>
                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <TimeFormField
                    compact
                    label="Opens"
                    value={row.open}
                    onChange={(time) => updateInterval(index, { open: time })}
                  />
                </View>
                <View style={styles.timeCol}>
                  <TimeFormField
                    compact
                    label="Closes"
                    value={row.close}
                    onChange={(time) => updateInterval(index, { close: time })}
                  />
                </View>
              </View>
            </View>
          ))}

          <Pressable
            onPress={addInterval}
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
            <Ionicons name="add-circle-outline" size={17} color={theme.emerald} />
            <Text style={styles.addButtonText}>Add another time period</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      ...theme.shadowCard,
    },
    cardClosed: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 0,
    },
    cardOpen: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerRowClosed: {
      alignItems: 'center',
    },
    titleBlock: {
      flex: 1,
      gap: 2,
    },
    dayLabel: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    summary: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
    },
    toggleRow: {
      alignItems: 'flex-end',
      gap: 2,
    },
    toggleLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    periods: {
      gap: 8,
    },
    periodBlock: {
      gap: 6,
      paddingTop: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    periodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    periodTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    timeCol: {
      flex: 1,
      minWidth: 0,
    },
    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    removePressed: {
      opacity: 0.85,
    },
    removeText: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 42,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    addButtonPressed: {
      opacity: 0.9,
    },
    addButtonText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    error: {
      color: theme.danger,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
      marginTop: 4,
    },
  });
}
