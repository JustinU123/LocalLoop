import type { DayOfWeekKey } from '@/types/business-hours';

export const DAY_OF_WEEK_LABELS: Record<DayOfWeekKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const MAX_INTERVALS_PER_DAY = 8;
