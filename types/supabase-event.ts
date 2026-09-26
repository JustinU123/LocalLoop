import type {
  EventAgeRequirement,
  EventDraft,
  EventLocationType,
  EventTicketType,
} from '@/types/event-draft';

export type EventStatus = 'draft' | 'published' | 'archived';

export type EventRow = {
  id: string;
  business_id: string;
  status: EventStatus;
  image_url: string | null;
  event_name: string;
  description: string;
  event_date: string;
  start_at: string;
  end_at: string | null;
  is_multi_day: boolean;
  end_date: string | null;
  location_type: EventLocationType;
  venue_name: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  event_link: string | null;
  ticket_type: EventTicketType;
  price_cents: number | null;
  ticket_link: string | null;
  rsvp_link: string | null;
  capacity: number | null;
  age_requirement: EventAgeRequirement | null;
  custom_age_requirement: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  additional_information: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessEvent = {
  id: string;
  businessId: string;
  status: EventStatus;
  imageUrl: string | null;
  draft: EventDraft;
  startAt: string;
  createdAt: string;
};
