import { supabase } from '@/lib/supabase';
import {
  deleteUploadedEventImage,
  extractEventImageStoragePath,
  uploadEventImage,
} from '@/services/eventStorage';
import { getOwnerEventManageSection, type OwnerEventManageSection } from '@/utils/event-owner';
import { getCurrentVerifiedBusiness } from '@/services/posts';
import type { EventDraft } from '@/types/event-draft';
import type { BusinessEvent, EventRow } from '@/types/supabase-event';
import {
  combineDateAndTime,
  parseIsoDate,
  serializeIsoDate,
  serializeTimeValue,
} from '@/utils/date-time';
import { getEventEndDateTime, getEventStatus, validateEventForm } from '@/utils/event-form';

export type EventErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'invalid_event'
  | 'network'
  | 'upload_failed'
  | 'insert_failed'
  | 'update_failed'
  | 'delete_failed'
  | 'archive_failed'
  | 'not_found'
  | 'unexpected';

export type PublishEventResult =
  | { ok: true; event: BusinessEvent }
  | { ok: false; code: EventErrorCode; message: string };

export type GetBusinessEventsResult =
  | { ok: true; events: BusinessEvent[] }
  | { ok: false; code: EventErrorCode; message: string };

export type OwnerManagedEvent = BusinessEvent & {
  manageSection: OwnerEventManageSection;
  statusLabel: ReturnType<typeof getEventStatus> | 'Canceled';
};

export type ListOwnerEventsResult =
  | { ok: true; events: OwnerManagedEvent[] }
  | { ok: false; code: EventErrorCode; message: string };

export type GetOwnerEventResult =
  | { ok: true; event: OwnerManagedEvent }
  | { ok: false; code: EventErrorCode; message: string };

export type MutateOwnerEventResult =
  | { ok: true; event?: BusinessEvent }
  | { ok: false; code: EventErrorCode; message: string };

const EVENT_SELECT =
  'id, business_id, status, image_url, event_name, description, event_date, start_at, end_at, is_multi_day, end_date, location_type, venue_name, street_address, city, state, postal_code, event_link, ticket_type, price_cents, ticket_link, rsvp_link, capacity, age_requirement, custom_age_requirement, contact_name, contact_phone, contact_email, additional_information, created_at, updated_at';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[events:${scope}]`, error);
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  return /network request failed|failed to fetch|network error/i.test(message);
}

function userFacingError(code: EventErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to publish.';
    case 'not_verified':
      return 'Your business must be verified before publishing events.';
    case 'invalid_event':
      return 'Complete all required event fields before publishing.';
    case 'network':
      return 'Check your connection and try again.';
    case 'upload_failed':
      return "We couldn't upload your event image. Please try again.";
    case 'insert_failed':
      return "We couldn't publish your event. Please try again.";
    case 'update_failed':
      return "We couldn't save your event changes. Please try again.";
    case 'delete_failed':
      return "We couldn't delete this event. Please try again.";
    case 'archive_failed':
      return "We couldn't cancel this event. Please try again.";
    case 'not_found':
      return 'This event could not be found.';
    default:
      return "We couldn't publish your event. Please try again.";
  }
}

async function requireVerifiedOwnerBusiness(): Promise<
  | { ok: true; businessId: string; userId: string }
  | { ok: false; code: EventErrorCode; message: string }
> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    const code: EventErrorCode =
      verified.code === 'unauthenticated' ||
      verified.code === 'not_verified' ||
      verified.code === 'network'
        ? verified.code
        : 'unexpected';
    return {
      ok: false,
      code,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code)
          : verified.message,
    };
  }

  return { ok: true, businessId: verified.business.id, userId: verified.userId };
}

function mapRowToOwnerManagedEvent(row: EventRow): OwnerManagedEvent {
  const event = eventRowToBusinessEvent(row);
  const manageSection = getOwnerEventManageSection(event);
  const statusLabel = event.status === 'archived' ? 'Canceled' : getEventStatus(event.draft);
  return {
    ...event,
    manageSection,
    statusLabel,
  };
}

function dateColumnFromIso(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = parseIsoDate(value);
  if (!parsed) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
  const day = parsed.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isoDateFromDateColumn(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return serializeIsoDate(parsed);
}

function formatPriceFromCents(priceCents: number | null): string {
  if (priceCents === null || priceCents <= 0) {
    return '';
  }

  const dollars = priceCents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

function parsePriceCents(price: string): number | null {
  const value = Number(price);
  if (price.trim() === '' || Number.isNaN(value) || value <= 0) {
    return null;
  }

  return Math.round(value * 100);
}

function parseCapacity(capacity: string): number | null {
  const trimmed = capacity.trim();
  if (!trimmed) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function isLocalImageUri(uri: string): boolean {
  const trimmed = uri.trim();
  return (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('ph://') ||
    trimmed.startsWith('assets-library:')
  );
}

function buildEventFieldsPayload(draft: EventDraft, imageUrl: string | null) {
  const startDateTime = combineDateAndTime(draft.eventDate, draft.startTime);
  const endDateTime = getEventEndDateTime(draft);

  if (!startDateTime) {
    return null;
  }

  const eventDate = dateColumnFromIso(draft.eventDate);
  if (!eventDate) {
    return null;
  }

  return {
    image_url: imageUrl,
    event_name: draft.eventName.trim(),
    description: draft.description.trim(),
    event_date: eventDate,
    start_at: startDateTime.toISOString(),
    end_at: endDateTime ? endDateTime.toISOString() : null,
    is_multi_day: draft.isMultiDay,
    end_date: draft.isMultiDay ? dateColumnFromIso(draft.endDate) : null,
    location_type: draft.locationType,
    venue_name: draft.locationType === 'different' ? draft.venueName.trim() : null,
    street_address: draft.locationType === 'different' ? draft.streetAddress.trim() : null,
    city: draft.locationType === 'different' ? draft.city.trim() : null,
    state: draft.locationType === 'different' ? draft.state.trim() : null,
    postal_code: draft.locationType === 'different' ? draft.zipCode.trim() : null,
    event_link: draft.locationType === 'online' ? draft.eventLink.trim() : null,
    ticket_type: draft.ticketType,
    price_cents: draft.ticketType === 'paid' ? parsePriceCents(draft.price) : null,
    ticket_link: draft.ticketType === 'paid' && draft.ticketLink.trim() ? draft.ticketLink.trim() : null,
    rsvp_link: draft.ticketType === 'rsvp' ? draft.rsvpLink.trim() : null,
    capacity: parseCapacity(draft.capacity),
    age_requirement: draft.ageRequirement ? draft.ageRequirement : null,
    custom_age_requirement:
      draft.ageRequirement === 'custom' ? draft.customAgeRequirement.trim() || null : null,
    contact_name: draft.contactName.trim() || null,
    contact_phone: draft.contactPhone.trim() || null,
    contact_email: draft.contactEmail.trim() || null,
    additional_information: draft.additionalInformation.trim() || null,
  };
}

async function resolveEventImageForSave(params: {
  draft: EventDraft;
  businessId: string;
  userId: string;
  previousImageUrl: string | null;
}): Promise<
  | { ok: true; imageUrl: string | null; uploadedPath: string | null; previousPathToDelete: string | null }
  | { ok: false; code: EventErrorCode; message: string }
> {
  const imageUri = params.draft.imageUri?.trim() ?? '';
  const previousPath = extractEventImageStoragePath(params.previousImageUrl);

  if (!imageUri) {
    return {
      ok: true,
      imageUrl: null,
      uploadedPath: null,
      previousPathToDelete: previousPath,
    };
  }

  if (isLocalImageUri(imageUri)) {
    const uploadResult = await uploadEventImage({
      businessId: params.businessId,
      userId: params.userId,
      uri: imageUri,
    });

    if (!uploadResult.ok) {
      return {
        ok: false,
        code: 'upload_failed',
        message: uploadResult.message,
      };
    }

    return {
      ok: true,
      imageUrl: uploadResult.publicUrl,
      uploadedPath: uploadResult.path,
      previousPathToDelete: previousPath,
    };
  }

  const unchangedRemote = params.previousImageUrl?.trim() === imageUri;
  return {
    ok: true,
    imageUrl: imageUri,
    uploadedPath: null,
    previousPathToDelete: unchangedRemote ? null : previousPath,
  };
}

export function eventRowToBusinessEvent(row: EventRow): BusinessEvent {
  const startAtDate = new Date(row.start_at);
  const endAtDate = row.end_at ? new Date(row.end_at) : null;

  const eventDate = isoDateFromDateColumn(row.event_date) ?? serializeIsoDate(startAtDate);
  const endDate = row.end_date ? isoDateFromDateColumn(row.end_date) : null;

  let endTime: string | null = null;
  if (endAtDate) {
    endTime = serializeTimeValue(endAtDate);
  }

  const draft: EventDraft = {
    imageUri: row.image_url,
    eventName: row.event_name,
    description: row.description,
    eventDate,
    startTime: serializeTimeValue(startAtDate),
    endTime,
    isMultiDay: row.is_multi_day,
    endDate,
    locationType: row.location_type,
    venueName: row.venue_name?.trim() ?? '',
    streetAddress: row.street_address?.trim() ?? '',
    city: row.city?.trim() ?? '',
    state: row.state?.trim() ?? '',
    zipCode: row.postal_code?.trim() ?? '',
    eventLink: row.event_link?.trim() ?? '',
    ticketType: row.ticket_type,
    price: formatPriceFromCents(row.price_cents),
    ticketLink: row.ticket_link?.trim() ?? '',
    rsvpLink: row.rsvp_link?.trim() ?? '',
    capacity: row.capacity !== null ? String(row.capacity) : '',
    ageRequirement: row.age_requirement ?? '',
    customAgeRequirement: row.custom_age_requirement?.trim() ?? '',
    contactName: row.contact_name?.trim() ?? '',
    contactPhone: row.contact_phone?.trim() ?? '',
    contactEmail: row.contact_email?.trim() ?? '',
    additionalInformation: row.additional_information?.trim() ?? '',
  };

  return {
    id: row.id,
    businessId: row.business_id,
    status: row.status,
    imageUrl: row.image_url,
    draft,
    startAt: row.start_at,
    createdAt: row.created_at,
  };
}

function buildInsertPayload(draft: EventDraft, businessId: string, imageUrl: string | null) {
  const fields = buildEventFieldsPayload(draft, imageUrl);
  if (!fields) {
    return null;
  }

  return {
    business_id: businessId,
    status: 'published' as const,
    ...fields,
  };
}

export async function publishEvent(draft: EventDraft): Promise<PublishEventResult> {
  const { valid } = validateEventForm(draft);
  if (!valid) {
    return {
      ok: false,
      code: 'invalid_event',
      message: userFacingError('invalid_event'),
    };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    const code: EventErrorCode =
      verified.code === 'unauthenticated' ||
      verified.code === 'not_verified' ||
      verified.code === 'network'
        ? verified.code
        : 'unexpected';
    return {
      ok: false,
      code,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code)
          : verified.message,
    };
  }

  const { business, userId } = verified;
  const payload = buildInsertPayload(draft, business.id, null);

  if (!payload) {
    return {
      ok: false,
      code: 'invalid_event',
      message: userFacingError('invalid_event'),
    };
  }

  let uploadedPath: string | null = null;
  let imageUrl: string | null = null;

  const imageUri = draft.imageUri?.trim();
  if (imageUri) {
    if (isLocalImageUri(imageUri)) {
      const uploadResult = await uploadEventImage({
        businessId: business.id,
        userId,
        uri: imageUri,
      });

      if (!uploadResult.ok) {
        return {
          ok: false,
          code: 'upload_failed',
          message: uploadResult.message,
        };
      }

      uploadedPath = uploadResult.path;
      imageUrl = uploadResult.publicUrl;
    } else {
      imageUrl = imageUri;
    }
  }

  payload.image_url = imageUrl;

  try {
    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select(EVENT_SELECT)
      .single();

    if (error) {
      logDevError('publishEvent.insert', error);
      if (uploadedPath) {
        await deleteUploadedEventImage(uploadedPath);
      }
      const code: EventErrorCode = isNetworkError(error) ? 'network' : 'insert_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const event = eventRowToBusinessEvent(data as EventRow);
    return { ok: true, event };
  } catch (error) {
    logDevError('publishEvent', error);
    if (uploadedPath) {
      await deleteUploadedEventImage(uploadedPath);
    }
    const code = isNetworkError(error) ? 'network' : 'insert_failed';
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }
}

export async function getBusinessEvents(businessId: string): Promise<GetBusinessEventsResult> {
  if (!businessId) {
    return { ok: true, events: [] };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .eq('business_id', businessId)
      .eq('status', 'published')
      .order('start_at', { ascending: true });

    if (error) {
      logDevError('getBusinessEvents', error);
      const code: EventErrorCode = isNetworkError(error) ? 'network' : 'unexpected';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const events = ((data as EventRow[] | null) ?? []).map(eventRowToBusinessEvent);
    return { ok: true, events };
  } catch (error) {
    logDevError('getBusinessEvents', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }
}

export async function listOwnerEvents(): Promise<ListOwnerEventsResult> {
  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .eq('business_id', owner.businessId)
      .in('status', ['published', 'archived'])
      .order('start_at', { ascending: true });

    if (error) {
      logDevError('listOwnerEvents', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load your events.',
      };
    }

    const events = ((data as EventRow[] | null) ?? []).map(mapRowToOwnerManagedEvent);
    return { ok: true, events };
  } catch (error) {
    logDevError('listOwnerEvents', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load your events.',
    };
  }
}

export async function getOwnerEventById(eventId: string): Promise<GetOwnerEventResult> {
  const trimmedId = eventId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .maybeSingle();

    if (error) {
      logDevError('getOwnerEventById', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'unexpected',
        message: 'Unable to load this event.',
      };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    return { ok: true, event: mapRowToOwnerManagedEvent(data as EventRow) };
  } catch (error) {
    logDevError('getOwnerEventById', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: 'Unable to load this event.',
    };
  }
}

export async function archiveOwnerEvent(eventId: string): Promise<MutateOwnerEventResult> {
  const trimmedId = eventId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .eq('status', 'published')
      .select(EVENT_SELECT)
      .maybeSingle();

    if (error) {
      logDevError('archiveOwnerEvent', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'archive_failed',
        message: userFacingError('archive_failed'),
      };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    return { ok: true, event: eventRowToBusinessEvent(data as EventRow) };
  } catch (error) {
    logDevError('archiveOwnerEvent', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'archive_failed',
      message: userFacingError('archive_failed'),
    };
  }
}

export async function deleteOwnerEvent(eventId: string): Promise<MutateOwnerEventResult> {
  const trimmedId = eventId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  try {
    const existing = await getOwnerEventById(trimmedId);
    if (!existing.ok) {
      return existing;
    }

    const imagePath = extractEventImageStoragePath(existing.event.imageUrl);

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId);

    if (error) {
      logDevError('deleteOwnerEvent', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'delete_failed',
        message: userFacingError('delete_failed'),
      };
    }

    if (imagePath) {
      await deleteUploadedEventImage(imagePath);
    }

    return { ok: true };
  } catch (error) {
    logDevError('deleteOwnerEvent', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'delete_failed',
      message: userFacingError('delete_failed'),
    };
  }
}

export async function updateOwnerEvent(eventId: string, draft: EventDraft): Promise<PublishEventResult> {
  const trimmedId = eventId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const { valid } = validateEventForm(draft);
  if (!valid) {
    return {
      ok: false,
      code: 'invalid_event',
      message: userFacingError('invalid_event'),
    };
  }

  const owner = await requireVerifiedOwnerBusiness();
  if (!owner.ok) {
    return owner;
  }

  const existing = await getOwnerEventById(trimmedId);
  if (!existing.ok) {
    return existing;
  }

  if (existing.event.manageSection === 'ended') {
    return {
      ok: false,
      code: 'invalid_event',
      message: 'Ended events cannot be edited.',
    };
  }

  const imageResolution = await resolveEventImageForSave({
    draft,
    businessId: owner.businessId,
    userId: owner.userId,
    previousImageUrl: existing.event.imageUrl,
  });

  if (!imageResolution.ok) {
    return imageResolution;
  }

  const payload = buildEventFieldsPayload(draft, imageResolution.imageUrl);
  if (!payload) {
    return {
      ok: false,
      code: 'invalid_event',
      message: userFacingError('invalid_event'),
    };
  }

  const { uploadedPath, previousPathToDelete } = imageResolution;

  try {
    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .select(EVENT_SELECT)
      .single();

    if (error) {
      logDevError('updateOwnerEvent', error);
      if (uploadedPath) {
        await deleteUploadedEventImage(uploadedPath);
      }
      const code: EventErrorCode = isNetworkError(error) ? 'network' : 'update_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const event = eventRowToBusinessEvent(data as EventRow);

    const shouldDeletePrevious =
      previousPathToDelete &&
      previousPathToDelete !== uploadedPath &&
      previousPathToDelete !== extractEventImageStoragePath(event.imageUrl);

    if (shouldDeletePrevious) {
      await deleteUploadedEventImage(previousPathToDelete);
    }

    return { ok: true, event };
  } catch (error) {
    logDevError('updateOwnerEvent', error);
    if (uploadedPath) {
      await deleteUploadedEventImage(uploadedPath);
    }
    const code = isNetworkError(error) ? 'network' : 'update_failed';
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }
}
