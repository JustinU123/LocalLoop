export const REPORT_CATEGORIES = [
  'App bug',
  'Incorrect business information',
  'Map or location issue',
  'Account issue',
  'Promotion issue',
  'Inappropriate content',
  'Other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
