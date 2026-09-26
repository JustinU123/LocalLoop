import { MAX_INTERVALS_PER_DAY } from '@/constants/business-hours';
import type {
  BusinessDayHours,
  BusinessHoursInterval,
  BusinessHoursValidationErrors,
  WeeklyBusinessHours,
} from '@/types/business-hours';
import { DAY_OF_WEEK_KEYS } from '@/types/business-hours';
import { parseTimeValue } from '@/utils/date-time';

/**
 * Overnight intervals: when close <= open (as minutes from midnight), the business stays
 * open from `open` through midnight and until `close` on the following calendar morning.
 * Example: Monday { open: "18:00", close: "02:00" } = Mon 6pm → Tue 2am.
 * Early-morning minutes (e.g. Tue 01:00) are covered by Monday's overnight interval, not Tuesday's list.
 */

export function createEmptyWeeklyBusinessHours(): WeeklyBusinessHours {
  return DAY_OF_WEEK_KEYS.reduce((acc, day) => {
    acc[day] = { closed: true, intervals: [] };
    return acc;
  }, {} as WeeklyBusinessHours);
}

/** True when at least one day has open intervals (not the default all-closed schedule). */
export function isBusinessHoursConfigured(weeklyHours: WeeklyBusinessHours): boolean {
  return DAY_OF_WEEK_KEYS.some((day) => {
    const dayHours = weeklyHours[day];
    return !dayHours.closed && dayHours.intervals.length > 0;
  });
}

export function createDefaultOpenDayHours(
  open: string,
  close: string,
): BusinessDayHours {
  return {
    closed: false,
    intervals: [{ open, close }],
  };
}

export function normalizeWeeklyBusinessHours(value: unknown): WeeklyBusinessHours {
  const empty = createEmptyWeeklyBusinessHours();
  if (!value || typeof value !== 'object') {
    return empty;
  }

  const record = value as Record<string, unknown>;

  for (const day of DAY_OF_WEEK_KEYS) {
    const rawDay = record[day];
    if (!rawDay || typeof rawDay !== 'object') {
      continue;
    }

    const dayObj = rawDay as Record<string, unknown>;
    const closed = Boolean(dayObj.closed);
    const intervalsRaw = dayObj.intervals;

    if (closed) {
      empty[day] = { closed: true, intervals: [] };
      continue;
    }

    const intervals: BusinessHoursInterval[] = [];
    if (Array.isArray(intervalsRaw)) {
      for (const entry of intervalsRaw) {
        if (!entry || typeof entry !== 'object') {
          continue;
        }
        const open = String((entry as { open?: unknown }).open ?? '').trim();
        const close = String((entry as { close?: unknown }).close ?? '').trim();
        if (open && close) {
          intervals.push({ open, close });
        }
      }
    }

    empty[day] = {
      closed: false,
      intervals: intervals.slice(0, MAX_INTERVALS_PER_DAY),
    };
  }

  return empty;
}

export function isValidWallClockTime(value: string): boolean {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value.trim());
}

function timeToMinutes(value: string): number | null {
  const parsed = parseTimeValue(value);
  if (!parsed) {
    return null;
  }
  return parsed.hours * 60 + parsed.minutes;
}

type MinuteSpan = {
  start: number;
  end: number;
};

/** Map an interval to one or two spans on [0, 1440) for same-day overlap detection. */
function intervalToSameDaySpans(interval: BusinessHoursInterval): MinuteSpan[] | null {
  const openMin = timeToMinutes(interval.open);
  const closeMin = timeToMinutes(interval.close);
  if (openMin === null || closeMin === null || openMin === closeMin) {
    return null;
  }

  if (closeMin > openMin) {
    return [{ start: openMin, end: closeMin }];
  }

  return [
    { start: openMin, end: 1440 },
    { start: 0, end: closeMin },
  ];
}

function spansOverlap(a: MinuteSpan, b: MinuteSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

function intervalsOverlapOnSameDay(
  left: BusinessHoursInterval,
  right: BusinessHoursInterval,
): boolean {
  const leftSpans = intervalToSameDaySpans(left);
  const rightSpans = intervalToSameDaySpans(right);
  if (!leftSpans || !rightSpans) {
    return false;
  }

  for (const a of leftSpans) {
    for (const b of rightSpans) {
      if (spansOverlap(a, b)) {
        return true;
      }
    }
  }

  return false;
}

function isDuplicateInterval(a: BusinessHoursInterval, b: BusinessHoursInterval): boolean {
  return a.open === b.open && a.close === b.close;
}

export function validateBusinessDayHours(day: BusinessDayHours): string | null {
  if (day.closed) {
    if (day.intervals.length > 0) {
      return 'Closed days cannot have open hours.';
    }
    return null;
  }

  if (day.intervals.length === 0) {
    return 'Add at least one open period or mark the day closed.';
  }

  if (day.intervals.length > MAX_INTERVALS_PER_DAY) {
    return `A day can have at most ${MAX_INTERVALS_PER_DAY} periods.`;
  }

  for (const interval of day.intervals) {
    if (!interval.open.trim() || !interval.close.trim()) {
      return 'Each period needs an opening and closing time.';
    }
    if (!isValidWallClockTime(interval.open) || !isValidWallClockTime(interval.close)) {
      return 'Use valid times for each period.';
    }
    if (interval.open === interval.close) {
      return 'Opening and closing times cannot be the same.';
    }
  }

  for (let i = 0; i < day.intervals.length; i += 1) {
    for (let j = i + 1; j < day.intervals.length; j += 1) {
      if (isDuplicateInterval(day.intervals[i], day.intervals[j])) {
        return 'Remove duplicate time periods.';
      }
      if (intervalsOverlapOnSameDay(day.intervals[i], day.intervals[j])) {
        return 'Time periods cannot overlap.';
      }
    }
  }

  return null;
}

export function validateWeeklyBusinessHours(
  schedule: WeeklyBusinessHours,
): { valid: boolean; errors: BusinessHoursValidationErrors; message: string | null } {
  const errors: BusinessHoursValidationErrors = {};

  for (const day of DAY_OF_WEEK_KEYS) {
    const dayError = validateBusinessDayHours(schedule[day]);
    if (dayError) {
      errors[day] = dayError;
    }
  }

  const firstDayError = DAY_OF_WEEK_KEYS.map((day) => errors[day]).find(Boolean) ?? null;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    message: firstDayError,
  };
}

export function weeklyHoursForDatabase(schedule: WeeklyBusinessHours): WeeklyBusinessHours {
  const next = createEmptyWeeklyBusinessHours();

  for (const day of DAY_OF_WEEK_KEYS) {
    const dayHours = schedule[day];
    if (dayHours.closed) {
      next[day] = { closed: true, intervals: [] };
      continue;
    }

    next[day] = {
      closed: false,
      intervals: dayHours.intervals.map((interval) => ({
        open: interval.open.trim(),
        close: interval.close.trim(),
      })),
    };
  }

  return next;
}
