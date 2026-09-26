/**
 * Utility-level Open Now checks (no test runner dependency).
 * Run: npx tsx scripts/run-business-open-now-tests.ts
 */

import type { WeeklyBusinessHours } from '../types/business-hours';
import { createEmptyWeeklyBusinessHours } from '../utils/business-hours';
import { evaluateBusinessOpenNow } from '../utils/business-open-now';

const TZ = 'America/Los_Angeles';

type Case = {
  name: string;
  weeklyHours: WeeklyBusinessHours;
  at: Date;
  expectedOpen: boolean;
};

function atLocalWallTime(
  timeZone: string,
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  },
): Date {
  const guess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  for (let offsetHours = -16; offsetHours <= 16; offsetHours += 1) {
    const candidate = new Date(guess.getTime() + offsetHours * 60 * 60 * 1000);
    const formatted = formatter.formatToParts(candidate);
    const year = Number(formatted.find((p) => p.type === 'year')?.value);
    const month = Number(formatted.find((p) => p.type === 'month')?.value);
    const day = Number(formatted.find((p) => p.type === 'day')?.value);
    const hour = Number(formatted.find((p) => p.type === 'hour')?.value);
    const minute = Number(formatted.find((p) => p.type === 'minute')?.value);

    if (
      year === parts.year &&
      month === parts.month &&
      day === parts.day &&
      hour === parts.hour &&
      minute === parts.minute
    ) {
      return candidate;
    }
  }

  throw new Error(`Could not construct zoned instant for ${JSON.stringify(parts)}`);
}

function buildSchedule(partial: Partial<WeeklyBusinessHours>): WeeklyBusinessHours {
  return { ...createEmptyWeeklyBusinessHours(), ...partial };
}

const cases: Case[] = [
  {
    name: 'normal same-day hours — open mid-day',
    weeklyHours: buildSchedule({
      wednesday: { closed: false, intervals: [{ open: '08:00', close: '18:00' }] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 18, hour: 12, minute: 0 }),
    expectedOpen: true,
  },
  {
    name: 'before opening',
    weeklyHours: buildSchedule({
      wednesday: { closed: false, intervals: [{ open: '08:00', close: '18:00' }] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 18, hour: 7, minute: 30 }),
    expectedOpen: false,
  },
  {
    name: 'exact opening time (inclusive)',
    weeklyHours: buildSchedule({
      wednesday: { closed: false, intervals: [{ open: '08:00', close: '18:00' }] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 18, hour: 8, minute: 0 }),
    expectedOpen: true,
  },
  {
    name: 'exact closing time (exclusive)',
    weeklyHours: buildSchedule({
      wednesday: { closed: false, intervals: [{ open: '08:00', close: '18:00' }] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 18, hour: 18, minute: 0 }),
    expectedOpen: false,
  },
  {
    name: 'closed day',
    weeklyHours: buildSchedule({
      sunday: { closed: true, intervals: [] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 22, hour: 12, minute: 0 }),
    expectedOpen: false,
  },
  {
    name: 'split hours between periods — lunch gap',
    weeklyHours: buildSchedule({
      wednesday: {
        closed: false,
        intervals: [
          { open: '08:00', close: '11:00' },
          { open: '17:00', close: '21:00' },
        ],
      },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 18, hour: 15, minute: 0 }),
    expectedOpen: false,
  },
  {
    name: 'split hours between periods — dinner open',
    weeklyHours: buildSchedule({
      wednesday: {
        closed: false,
        intervals: [
          { open: '08:00', close: '11:00' },
          { open: '17:00', close: '21:00' },
        ],
      },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 18, hour: 18, minute: 0 }),
    expectedOpen: true,
  },
  {
    name: 'overnight before midnight',
    weeklyHours: buildSchedule({
      friday: { closed: false, intervals: [{ open: '18:00', close: '02:00' }] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 20, hour: 23, minute: 0 }),
    expectedOpen: true,
  },
  {
    name: 'overnight after midnight — Saturday 1:00 AM with Saturday closed',
    weeklyHours: buildSchedule({
      friday: { closed: false, intervals: [{ open: '18:00', close: '02:00' }] },
      saturday: { closed: true, intervals: [] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 21, hour: 1, minute: 0 }),
    expectedOpen: true,
  },
  {
    name: 'previous-day overnight when current day is closed — after close',
    weeklyHours: buildSchedule({
      friday: { closed: false, intervals: [{ open: '18:00', close: '02:00' }] },
      saturday: { closed: true, intervals: [] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 21, hour: 3, minute: 0 }),
    expectedOpen: false,
  },
  {
    name: 'timezone/DST — spring forward day still respects wall-clock hours',
    weeklyHours: buildSchedule({
      sunday: { closed: false, intervals: [{ open: '09:00', close: '17:00' }] },
    }),
    at: atLocalWallTime(TZ, { year: 2026, month: 3, day: 8, hour: 10, minute: 0 }),
    expectedOpen: true,
  },
];

let failed = 0;

for (const testCase of cases) {
  const result = evaluateBusinessOpenNow({
    weeklyHours: testCase.weeklyHours,
    timezone: TZ,
    at: testCase.at,
  });

  if (!result.ok) {
    console.error(`FAIL ${testCase.name}: evaluator error ${result.reason}`);
    failed += 1;
    continue;
  }

  if (result.isOpen !== testCase.expectedOpen) {
    console.error(
      `FAIL ${testCase.name}: expected ${testCase.expectedOpen ? 'OPEN' : 'CLOSED'}, got ${result.isOpen ? 'OPEN' : 'CLOSED'}`,
    );
    failed += 1;
    continue;
  }

  console.log(`PASS ${testCase.name}`);
}

if (failed > 0) {
  process.exit(1);
}

console.log(`\nAll ${cases.length} Open Now utility cases passed.`);
