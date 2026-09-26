/** Normalizes period_start for owner period RPCs (ISO string). */
export function normalizeAnalyticsPeriodStart(periodStart: string | Date): string | null {
  if (periodStart instanceof Date) {
    if (Number.isNaN(periodStart.getTime())) {
      return null;
    }
    return periodStart.toISOString();
  }
  const trimmed = periodStart.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}
