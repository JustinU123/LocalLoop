import { DAY_OF_WEEK_LABELS } from '@/constants/business-hours';
import type { BusinessDayHours, DayOfWeekKey } from '@/types/business-hours';
import { formatDisplayTime } from '@/utils/date-time';

function formatIntervalRange(open: string, close: string): string {
  return `${formatDisplayTime(open)} – ${formatDisplayTime(close)}`;
}

export function formatBusinessDayHoursSummary(dayHours: BusinessDayHours): string {
  if (dayHours.closed || dayHours.intervals.length === 0) {
    return 'Closed';
  }

  return dayHours.intervals
    .map((interval) => formatIntervalRange(interval.open, interval.close))
    .join(', ');
}

export function formatBusinessDayHoursRow(day: DayOfWeekKey, dayHours: BusinessDayHours): string {
  return `${DAY_OF_WEEK_LABELS[day]} ${formatBusinessDayHoursSummary(dayHours)}`;
}
