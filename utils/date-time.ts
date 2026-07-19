export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function parseIsoDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function serializeIsoDate(date: Date): string {
  return startOfDay(date).toISOString();
}

export function formatDisplayDate(value: string | null): string {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return 'Select date';
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isSameDay(left: Date, right: Date): boolean {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function parseTimeValue(value: string | null): { hours: number; minutes: number } | null {
  if (!value) {
    return null;
  }

  const [hoursText, minutesText] = value.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return { hours, minutes };
}

export function serializeTimeValue(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDisplayTime(value: string | null): string {
  const parsed = parseTimeValue(value);
  if (!parsed) {
    return 'Select time';
  }

  const date = new Date();
  date.setHours(parsed.hours, parsed.minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function combineDateAndTime(dateValue: string | null, timeValue: string | null): Date | null {
  const date = parseIsoDate(dateValue);
  const time = parseTimeValue(timeValue);
  if (!date || !time) {
    return null;
  }

  const combined = new Date(date);
  combined.setHours(time.hours, time.minutes, 0, 0);
  return combined;
}

export function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function todayStart(): Date {
  return startOfDay(new Date());
}
