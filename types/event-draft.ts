export type EventLocationType = 'business' | 'different' | 'online';
export type EventTicketType = 'free' | 'paid' | 'rsvp';
export type EventAgeRequirement = 'all-ages' | '18+' | '21+' | 'custom';
export type EventStatusLabel = 'Upcoming' | 'Happening Today' | 'In Progress' | 'Ended';

export type EventDraft = {
  imageUri: string | null;
  eventName: string;
  description: string;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  isMultiDay: boolean;
  endDate: string | null;
  locationType: EventLocationType;
  venueName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  eventLink: string;
  ticketType: EventTicketType;
  price: string;
  ticketLink: string;
  rsvpLink: string;
  capacity: string;
  ageRequirement: EventAgeRequirement | '';
  customAgeRequirement: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  additionalInformation: string;
};

export type EventFormErrors = Partial<Record<keyof EventDraft | 'businessAddress', string>>;

export const EMPTY_EVENT_DRAFT: EventDraft = {
  imageUri: null,
  eventName: '',
  description: '',
  eventDate: null,
  startTime: null,
  endTime: null,
  isMultiDay: false,
  endDate: null,
  locationType: 'business',
  venueName: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  eventLink: '',
  ticketType: 'free',
  price: '',
  ticketLink: '',
  rsvpLink: '',
  capacity: '',
  ageRequirement: '',
  customAgeRequirement: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  additionalInformation: '',
};
