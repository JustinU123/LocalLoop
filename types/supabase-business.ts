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
