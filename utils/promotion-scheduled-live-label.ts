/**
 * Owner-facing "Live in …" copy for scheduled promotions on the public profile.
 * Uses the same ISO start_at instant as promotion lifecycle (no separate timezone math).
 */

function parseStartMs(startAtIso: string): number | null {
  const trimmed = startAtIso.trim();
  if (!trimmed) {
    return null;
  }
  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function localCalendarParts(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  const pa = localCalendarParts(a);
  const pb = localCalendarParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

function isTomorrowLocal(start: Date, now: Date): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameLocalCalendarDay(start, tomorrow);
}

function formatLocalTime(start: Date): string {
  return start.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatLaterCalendarLabel(start: Date): string {
  const monthDay = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `Live ${monthDay} at ${formatLocalTime(start)}`;
}

/**
 * Returns null when the promotion should not show a scheduled pill (already live, ended, or invalid start).
 */
export function formatScheduledPromotionLiveLabel(
  startAtIso: string,
  now = new Date(),
): string | null {
  const startMs = parseStartMs(startAtIso);
  if (startMs === null) {
    return null;
  }

  const nowMs = now.getTime();
  if (startMs <= nowMs) {
    return null;
  }

  const diffMinutes = Math.ceil((startMs - nowMs) / 60_000);
  if (diffMinutes <= 0) {
    return null;
  }

  if (diffMinutes < 60) {
    return `Live in ${diffMinutes} min`;
  }

  const start = new Date(startMs);

  if (isTomorrowLocal(start, now)) {
    return `Live tomorrow at ${formatLocalTime(start)}`;
  }

  if (isSameLocalCalendarDay(start, now)) {
    const hours = Math.ceil(diffMinutes / 60);
    return `Live in ${hours} hr`;
  }

  return formatLaterCalendarLabel(start);
}
