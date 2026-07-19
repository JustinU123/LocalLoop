import { EVENT_FIELD_LIMITS } from '@/constants/event-create';
import type { BusinessApplication } from '@/types/account-mode';
import type { EventDraft, EventFormErrors, EventStatusLabel } from '@/types/event-draft';
import { EMPTY_EVENT_DRAFT } from '@/types/event-draft';
import {
  combineDateAndTime,
  formatDisplayDate,
  formatDisplayTime,
  isSameDay,
  isValidEmail,
  isValidUrl,
  parseIsoDate,
  parseTimeValue,
  startOfDay,
  todayStart,
} from '@/utils/date-time';

let draft: EventDraft | null = null;

export function setEventDraft(next: EventDraft) {
  draft = next;
}

export function getEventDraft(): EventDraft | null {
  return draft;
}

export function clearEventDraft() {
  draft = null;
}

export function createEmptyEventDraft(): EventDraft {
  return { ...EMPTY_EVENT_DRAFT };
}

export function getBusinessAddressLabel(application: BusinessApplication | null): string {
  const parts = [
    application?.addressOrServiceArea?.trim(),
    application?.city?.trim(),
    application?.state?.trim(),
    application?.zipCode?.trim(),
  ].filter(Boolean);

  if (parts.length === 0) {
    return 'Business address not available yet.';
  }

  return parts.join(', ');
}

export function getEventEndDateTime(form: EventDraft): Date | null {
  const startDateTime = combineDateAndTime(form.eventDate, form.startTime);
  if (!startDateTime) {
    return null;
  }

  if (form.isMultiDay) {
    const endDate = parseIsoDate(form.endDate);
    if (!endDate) {
      return null;
    }

    if (form.endTime) {
      return combineDateAndTime(form.endDate, form.endTime);
    }

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  if (form.endTime) {
    return combineDateAndTime(form.eventDate, form.endTime);
  }

  const endOfDay = new Date(startDateTime);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

export function getEventStatus(form: EventDraft): EventStatusLabel {
  const now = new Date();
  const startDateTime = combineDateAndTime(form.eventDate, form.startTime);
  const endDateTime = getEventEndDateTime(form);

  if (!startDateTime) {
    return 'Upcoming';
  }

  if (now < startDateTime) {
    if (isSameDay(now, startDateTime)) {
      return 'Happening Today';
    }
    return 'Upcoming';
  }

  if (endDateTime && now > endDateTime) {
    return 'Ended';
  }

  if (!endDateTime && !isSameDay(now, startDateTime)) {
    return 'Ended';
  }

  return 'In Progress';
}

export function formatEventSchedule(form: EventDraft): string {
  const startDate = formatDisplayDate(form.eventDate);
  const startTime = formatDisplayTime(form.startTime);
  const endTime = form.endTime ? formatDisplayTime(form.endTime) : null;

  if (form.isMultiDay && form.endDate) {
    const endDate = formatDisplayDate(form.endDate);
    const timeSuffix = endTime ? ` · Ends ${endTime}` : '';
    return `${startDate} ${startTime} – ${endDate}${timeSuffix}`;
  }

  if (endTime) {
    return `${startDate} · ${startTime} – ${endTime}`;
  }

  return `${startDate} · ${startTime}`;
}

export function getEventLocationLabel(
  form: EventDraft,
  businessAddress: string,
): string {
  if (form.locationType === 'online') {
    return 'Online Event';
  }

  if (form.locationType === 'business') {
    return businessAddress;
  }

  const parts = [
    form.venueName.trim(),
    form.streetAddress.trim(),
    form.city.trim(),
    form.state.trim(),
    form.zipCode.trim(),
  ].filter(Boolean);

  return parts.join(', ');
}

export function getAgeRequirementLabel(form: EventDraft): string | null {
  if (!form.ageRequirement) {
    return null;
  }

  if (form.ageRequirement === 'custom') {
    return form.customAgeRequirement.trim() || 'Custom';
  }

  switch (form.ageRequirement) {
    case 'all-ages':
      return 'All Ages';
    case '18+':
      return '18+';
    case '21+':
      return '21+';
    default:
      return null;
  }
}

export function formatEventPrice(price: string): string | null {
  const value = Number(price);
  if (!price.trim() || Number.isNaN(value) || value <= 0) {
    return null;
  }

  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

export function getTicketBadgeLabel(form: EventDraft): string {
  switch (form.ticketType) {
    case 'paid':
      return 'Paid';
    case 'rsvp':
      return 'RSVP Required';
    default:
      return 'Free';
  }
}

export function isEventFormEmpty(form: EventDraft): boolean {
  return (
    !form.imageUri &&
    !form.eventName.trim() &&
    !form.description.trim() &&
    !form.eventDate &&
    !form.startTime &&
    !form.endTime &&
    !form.endDate &&
    !form.venueName.trim() &&
    !form.streetAddress.trim() &&
    !form.city.trim() &&
    !form.state.trim() &&
    !form.zipCode.trim() &&
    !form.eventLink.trim() &&
    !form.price.trim() &&
    !form.ticketLink.trim() &&
    !form.rsvpLink.trim() &&
    !form.capacity.trim() &&
    !form.ageRequirement &&
    !form.customAgeRequirement.trim() &&
    !form.contactName.trim() &&
    !form.contactPhone.trim() &&
    !form.contactEmail.trim() &&
    !form.additionalInformation.trim() &&
    form.locationType === 'business' &&
    form.ticketType === 'free' &&
    !form.isMultiDay
  );
}

export function validateEventForm(form: EventDraft): {
  valid: boolean;
  errors: EventFormErrors;
} {
  const errors: EventFormErrors = {};

  if (!form.eventName.trim()) {
    errors.eventName = 'Event name is required.';
  } else if (form.eventName.length > EVENT_FIELD_LIMITS.eventName) {
    errors.eventName = `Maximum ${EVENT_FIELD_LIMITS.eventName} characters.`;
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.';
  } else if (form.description.length > EVENT_FIELD_LIMITS.description) {
    errors.description = `Maximum ${EVENT_FIELD_LIMITS.description} characters.`;
  }

  const eventDate = parseIsoDate(form.eventDate);
  const today = todayStart();

  if (!form.eventDate) {
    errors.eventDate = 'Event date is required.';
  } else if (eventDate && startOfDay(eventDate) < today) {
    errors.eventDate = 'Event date cannot be in the past.';
  }

  if (!form.startTime) {
    errors.startTime = 'Start time is required.';
  }

  if (form.isMultiDay) {
    const endDate = parseIsoDate(form.endDate);
    if (!form.endDate) {
      errors.endDate = 'End date is required for multi-day events.';
    } else if (eventDate && endDate && startOfDay(endDate) < startOfDay(eventDate)) {
      errors.endDate = 'End date cannot be before start date.';
    }
  }

  if (form.endTime && form.startTime && !form.isMultiDay && form.eventDate) {
    const startDateTime = combineDateAndTime(form.eventDate, form.startTime);
    const endDateTime = combineDateAndTime(form.eventDate, form.endTime);
    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      errors.endTime = 'End time must be after start time.';
    }
  }

  if (form.isMultiDay && form.endTime && form.endDate && form.eventDate) {
    const startDateTime = combineDateAndTime(form.eventDate, form.startTime);
    const endDateTime = combineDateAndTime(form.endDate, form.endTime);
    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      errors.endTime = 'End time must be after the event start.';
    }
  }

  if (form.locationType === 'different') {
    if (!form.venueName.trim()) errors.venueName = 'Venue name is required.';
    if (!form.streetAddress.trim()) errors.streetAddress = 'Street address is required.';
    if (!form.city.trim()) errors.city = 'City is required.';
    if (!form.state.trim()) errors.state = 'State is required.';
    if (!form.zipCode.trim()) errors.zipCode = 'ZIP code is required.';
  }

  if (form.locationType === 'online' && !isValidUrl(form.eventLink)) {
    errors.eventLink = 'Enter a valid event link.';
  }

  if (form.ticketType === 'paid') {
    const price = Number(form.price);
    if (!form.price.trim() || Number.isNaN(price) || price <= 0) {
      errors.price = 'Enter a price greater than zero.';
    }
    if (form.ticketLink.trim() && !isValidUrl(form.ticketLink)) {
      errors.ticketLink = 'Enter a valid ticket link.';
    }
  }

  if (form.ticketType === 'rsvp' && !isValidUrl(form.rsvpLink)) {
    errors.rsvpLink = 'Enter a valid RSVP link.';
  }

  if (form.capacity.trim()) {
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      errors.capacity = 'Capacity must be a positive whole number.';
    }
  }

  if (form.ageRequirement === 'custom' && !form.customAgeRequirement.trim()) {
    errors.customAgeRequirement = 'Enter a custom age requirement.';
  } else if (form.customAgeRequirement.length > EVENT_FIELD_LIMITS.customAgeRequirement) {
    errors.customAgeRequirement = `Maximum ${EVENT_FIELD_LIMITS.customAgeRequirement} characters.`;
  }

  if (form.contactEmail.trim() && !isValidEmail(form.contactEmail)) {
    errors.contactEmail = 'Enter a valid email address.';
  }

  if (form.additionalInformation.length > EVENT_FIELD_LIMITS.additionalInformation) {
    errors.additionalInformation = `Maximum ${EVENT_FIELD_LIMITS.additionalInformation} characters.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export { formatDisplayDate, formatDisplayTime, parseTimeValue };
