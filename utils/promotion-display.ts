import { formatDisplayDate, formatDisplayTime } from '@/utils/date-time';

export function formatPromotionScheduleFromIso(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '';
  }

  const startDate = formatDisplayDate(start.toISOString());
  const endDate = formatDisplayDate(end.toISOString());
  const startTime = formatDisplayTime(
    `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
  );
  const endTime = formatDisplayTime(
    `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
  );

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${startDate} · ${startTime} – ${endTime}`;
  }

  return `${startDate} ${startTime} – ${endDate} ${endTime}`;
}

export function formatPromotionExpiresLabel(endAt: string, now = new Date()): string {
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) {
    return '';
  }

  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 24) {
    if (diffHours < 1) {
      const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `Ends in ${minutes} min`;
    }
    const hours = Math.max(1, Math.round(diffHours));
    return `Ends in ${hours} hr${hours === 1 ? '' : 's'}`;
  }

  const diffDays = Math.ceil(diffHours / 24);
  if (diffDays === 1) {
    return 'Ends tomorrow';
  }

  if (diffDays <= 7) {
    return `Ends in ${diffDays} days`;
  }

  return `Ends ${formatDisplayDate(end.toISOString())}`;
}
