export type DbVerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'needs_information'
  | 'rejected';

export type DbAccountType = 'explorer' | 'business';

export type BusinessRow = {
  id: string;
  owner_user_id: string;
  name: string;
  category: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: DbVerificationStatus;
  verified_at: string | null;
  /** IANA timezone; present after 20260813_business_weekly_hours migration */
  timezone?: string | null;
  /** Structured weekly hours JSON; present after 20260813_business_weekly_hours migration */
  weekly_hours?: unknown;
  /** Present after 20260814_business_branding migration */
  logo_url?: string | null;
  logo_storage_path?: string | null;
  cover_image_url?: string | null;
  cover_storage_path?: string | null;
  /** Present after 20260815_profile_completion_celebrated migration */
  profile_completion_celebrated_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  account_type: DbAccountType;
  created_at: string;
  updated_at: string;
};
