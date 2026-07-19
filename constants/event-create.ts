export const EVENT_FIELD_LIMITS = {
  eventName: 80,
  description: 500,
  additionalInformation: 300,
  customAgeRequirement: 40,
} as const;

export const EVENT_PUBLISH_MESSAGE = 'Event publishing will be connected to LocalLoop next.';

export const EVENT_LOCATION_OPTIONS = [
  { id: 'business' as const, label: 'At Business Location' },
  { id: 'different' as const, label: 'Different Location' },
  { id: 'online' as const, label: 'Online Event' },
];

export const EVENT_TICKET_OPTIONS = [
  { id: 'free' as const, label: 'Free' },
  { id: 'paid' as const, label: 'Paid' },
  { id: 'rsvp' as const, label: 'RSVP Required' },
];

export const EVENT_AGE_OPTIONS = [
  { id: '' as const, label: 'None' },
  { id: 'all-ages' as const, label: 'All Ages' },
  { id: '18+' as const, label: '18+' },
  { id: '21+' as const, label: '21+' },
  { id: 'custom' as const, label: 'Custom' },
];
