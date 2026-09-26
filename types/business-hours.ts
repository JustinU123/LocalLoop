export const DAY_OF_WEEK_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayOfWeekKey = (typeof DAY_OF_WEEK_KEYS)[number];

/** Wall-clock local time "HH:MM" (24-hour). Not a UTC timestamp. */
export type WallClockTime = string;

export type BusinessHoursInterval = {
  open: WallClockTime;
  close: WallClockTime;
};

export type BusinessDayHours = {
  closed: boolean;
  intervals: BusinessHoursInterval[];
};

export type WeeklyBusinessHours = Record<DayOfWeekKey, BusinessDayHours>;

export type BusinessHoursValidationErrors = Partial<Record<DayOfWeekKey, string>> & {
  _form?: string;
};
