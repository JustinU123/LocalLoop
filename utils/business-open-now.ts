import type { BusinessDayHours, BusinessHoursInterval, DayOfWeekKey, WeeklyBusinessHours } from '@/types/business-hours';
import { DAY_OF_WEEK_KEYS } from '@/types/business-hours';
import { isBusinessHoursConfigured } from '@/utils/business-hours';
import { formatDisplayTime, parseTimeValue } from '@/utils/date-time';

export type BusinessOpenNowInput = {
  weeklyHours: WeeklyBusinessHours;
  /** IANA timezone for the business (never the viewer device timezone). */
  timezone: string;
  /** Instant to evaluate, usually `new Date()`. */
  at: Date;
};

export type BusinessOpenNowResult =
  | { ok: true; isOpen: boolean }
  | { ok: false; reason: 'missing_timezone' | 'invalid_timezone' };

const WEEKDAY_TO_KEY: Record<string, DayOfWeekKey> = {
  Monday: 'monday',
  Tuesday: 'tuesday',
  Wednesday: 'wednesday',
  Thursday: 'thursday',
  Friday: 'friday',
  Saturday: 'saturday',
  Sunday: 'sunday',
};

export function getZonedWeekdayAndMinutes(timeZone: string, at: Date): {
  day: DayOfWeekKey;
  minutesFromMidnight: number;
} | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(at);
    const weekday = parts.find((part) => part.type === 'weekday')?.value;
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? NaN);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? NaN);

    if (!weekday || !(weekday in WEEKDAY_TO_KEY) || Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }

    return {
      day: WEEKDAY_TO_KEY[weekday],
      minutesFromMidnight: hour * 60 + minute,
    };
  } catch {
    return null;
  }
}

function timeToMinutes(value: string): number | null {
  const parsed = parseTimeValue(value);
  if (!parsed) {
    return null;
  }
  return parsed.hours * 60 + parsed.minutes;
}

function isOvernightInterval(interval: BusinessHoursInterval): boolean {
  const openMin = timeToMinutes(interval.open);
  const closeMin = timeToMinutes(interval.close);
  if (openMin === null || closeMin === null) {
    return false;
  }
  return closeMin <= openMin;
}

/** Half-open [start, end) in minutes within a single calendar day segment. */
function isMinuteInSameDaySpan(minute: number, start: number, end: number): boolean {
  return minute >= start && minute < end;
}

function isOpenForDayInterval(minute: number, interval: BusinessHoursInterval): boolean {
  const openMin = timeToMinutes(interval.open);
  const closeMin = timeToMinutes(interval.close);
  if (openMin === null || closeMin === null || openMin === closeMin) {
    return false;
  }

  if (closeMin > openMin) {
    return isMinuteInSameDaySpan(minute, openMin, closeMin);
  }

  // Overnight interval on this weekday: evening segment only (morning spill handled via previous day).
  return minute >= openMin;
}

function isOpenFromPreviousDayOvernight(
  previousDay: BusinessDayHours,
  minutesFromMidnight: number,
): boolean {
  if (previousDay.closed) {
    return false;
  }

  for (const interval of previousDay.intervals) {
    if (!isOvernightInterval(interval)) {
      continue;
    }

    const closeMin = timeToMinutes(interval.close);
    if (closeMin === null) {
      continue;
    }

    // Early morning portion of an overnight interval that started yesterday.
    if (isMinuteInSameDaySpan(minutesFromMidnight, 0, closeMin)) {
      return true;
    }
  }

  return false;
}

function previousDayKey(day: DayOfWeekKey): DayOfWeekKey {
  const index = DAY_OF_WEEK_KEYS.indexOf(day);
  if (index <= 0) {
    return 'sunday';
  }
  return DAY_OF_WEEK_KEYS[index - 1];
}

function evaluateDayHours(dayHours: BusinessDayHours, minutesFromMidnight: number): boolean {
  if (dayHours.closed) {
    return false;
  }

  return dayHours.intervals.some((interval) => isOpenForDayInterval(minutesFromMidnight, interval));
}

/**
 * Phase 2 consumer Open Now evaluation.
 * Uses business IANA timezone + structured weekly hours (including overnight spill from previous day).
 */
export function evaluateBusinessOpenNow(input: BusinessOpenNowInput): BusinessOpenNowResult {
  const timezone = input.timezone.trim();
  if (!timezone) {
    return { ok: false, reason: 'missing_timezone' };
  }

  const zoned = getZonedWeekdayAndMinutes(timezone, input.at);
  if (!zoned) {
    return { ok: false, reason: 'invalid_timezone' };
  }

  const { day, minutesFromMidnight } = zoned;
  const today = input.weeklyHours[day];
  const yesterday = input.weeklyHours[previousDayKey(day)];

  const isOpen =
    evaluateDayHours(today, minutesFromMidnight) ||
    isOpenFromPreviousDayOvernight(yesterday, minutesFromMidnight);

  return { ok: true, isOpen };
}

export type BusinessHoursStatusResult =
  | {
      ok: true;
      primaryLine: string;
      secondaryLine: string | null;
    }
  | {
      ok: false;
      reason: 'missing_timezone' | 'invalid_timezone' | 'hours_not_configured';
    };

const DAY_LABEL: Record<DayOfWeekKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function nextDayKey(day: DayOfWeekKey): DayOfWeekKey {
  const index = DAY_OF_WEEK_KEYS.indexOf(day);
  if (index < 0 || index >= DAY_OF_WEEK_KEYS.length - 1) {
    return 'monday';
  }
  return DAY_OF_WEEK_KEYS[index + 1];
}

function findActiveCloseTime(
  day: DayOfWeekKey,
  yesterday: BusinessDayHours,
  today: BusinessDayHours,
  minutesFromMidnight: number,
): string | null {
  if (isOpenFromPreviousDayOvernight(yesterday, minutesFromMidnight)) {
    for (const interval of yesterday.intervals) {
      if (!isOvernightInterval(interval)) {
        continue;
      }
      const closeMin = timeToMinutes(interval.close);
      if (closeMin !== null && isMinuteInSameDaySpan(minutesFromMidnight, 0, closeMin)) {
        return interval.close;
      }
    }
  }

  if (today.closed) {
    return null;
  }

  for (const interval of today.intervals) {
    if (isOpenForDayInterval(minutesFromMidnight, interval)) {
      return interval.close;
    }
  }

  return null;
}

function findNextOpenSlot(
  weeklyHours: WeeklyBusinessHours,
  startDay: DayOfWeekKey,
  startAfterMinutes: number,
): { day: DayOfWeekKey; open: string; daysAhead: number } | null {
  let day = startDay;
  let daysAhead = 0;

  for (let step = 0; step < 7; step += 1) {
    const dayHours = weeklyHours[day];
    if (!dayHours.closed) {
      const sortedOpens = [...dayHours.intervals]
        .map((interval) => interval.open)
        .filter(Boolean)
        .sort((a, b) => (timeToMinutes(a) ?? 0) - (timeToMinutes(b) ?? 0));

      for (const open of sortedOpens) {
        const openMin = timeToMinutes(open);
        if (openMin === null) {
          continue;
        }
        if (daysAhead === 0 && openMin <= startAfterMinutes) {
          continue;
        }
        return { day, open, daysAhead };
      }
    }

    day = nextDayKey(day);
    daysAhead += 1;
    startAfterMinutes = -1;
  }

  return null;
}

/**
 * Human-readable open/closed status for owner dashboard (reuses evaluateBusinessOpenNow).
 */
export function getBusinessHoursStatus(input: BusinessOpenNowInput): BusinessHoursStatusResult {
  const timezone = input.timezone.trim();
  if (!timezone) {
    return { ok: false, reason: 'missing_timezone' };
  }

  if (!isBusinessHoursConfigured(input.weeklyHours)) {
    return { ok: false, reason: 'hours_not_configured' };
  }

  const openResult = evaluateBusinessOpenNow(input);
  if (!openResult.ok) {
    return { ok: false, reason: openResult.reason };
  }

  const zoned = getZonedWeekdayAndMinutes(timezone, input.at);
  if (!zoned) {
    return { ok: false, reason: 'invalid_timezone' };
  }

  const { day, minutesFromMidnight } = zoned;
  const today = input.weeklyHours[day];
  const yesterday = input.weeklyHours[previousDayKey(day)];

  if (openResult.isOpen) {
    const closeTime = findActiveCloseTime(day, yesterday, today, minutesFromMidnight);
    const secondary = closeTime ? `Closes at ${formatDisplayTime(closeTime)}` : null;
    return {
      ok: true,
      primaryLine: 'Your business is open',
      secondaryLine: secondary,
    };
  }

  const todayHasFutureOpen =
    !today.closed &&
    today.intervals.some((interval) => {
      const openMin = timeToMinutes(interval.open);
      return openMin !== null && openMin > minutesFromMidnight;
    });

  if (todayHasFutureOpen) {
    const nextToday = findNextOpenSlot(input.weeklyHours, day, minutesFromMidnight);
    if (nextToday) {
      return {
        ok: true,
        primaryLine: 'Closed',
        secondaryLine: `Opens at ${formatDisplayTime(nextToday.open)}`,
      };
    }
  }

  const nextSlot = findNextOpenSlot(input.weeklyHours, day, minutesFromMidnight);
  if (!nextSlot) {
    return {
      ok: true,
      primaryLine: 'Closed today',
      secondaryLine: null,
    };
  }

  if (nextSlot.daysAhead === 1) {
    return {
      ok: true,
      primaryLine: 'Closed',
      secondaryLine: `Opens tomorrow at ${formatDisplayTime(nextSlot.open)}`,
    };
  }

  if (nextSlot.daysAhead === 0) {
    return {
      ok: true,
      primaryLine: 'Closed',
      secondaryLine: `Opens at ${formatDisplayTime(nextSlot.open)}`,
    };
  }

  const dayLabel = nextSlot.daysAhead === 0 ? 'today' : DAY_LABEL[nextSlot.day];
  return {
    ok: true,
    primaryLine: 'Closed',
    secondaryLine: `Opens ${dayLabel} at ${formatDisplayTime(nextSlot.open)}`,
  };
}
