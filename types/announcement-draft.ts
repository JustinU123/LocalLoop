export type AnnouncementCategory =
  | 'general'
  | 'holiday-hours'
  | 'temporary-closure'
  | 'new-hours'
  | 'hiring'
  | 'important-update'
  | 'thank-you'
  | 'community'
  | 'other';

export type AnnouncementDraft = {
  imageUri: string | null;
  title: string;
  message: string;
  category: AnnouncementCategory | '';
  isPinned: boolean;
  hasExpiration: boolean;
  startDate: string | null;
  endDate: string | null;
  notifyFollowers: boolean;
};

export type AnnouncementFormErrors = Partial<Record<keyof AnnouncementDraft, string>>;

export const EMPTY_ANNOUNCEMENT_DRAFT: AnnouncementDraft = {
  imageUri: null,
  title: '',
  message: '',
  category: '',
  isPinned: false,
  hasExpiration: false,
  startDate: null,
  endDate: null,
  notifyFollowers: true,
};
