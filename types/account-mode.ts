export type AccountMode = 'explorer' | 'business_pending' | 'business_verified';

export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'needs_information'
  | 'rejected';

export type VerificationMethod =
  | 'official_business_email'
  | 'business_license'
  | 'sellers_permit'
  | 'utility_bill'
  | 'storefront_photos'
  | 'official_social_media'
  | 'other_proof';

export type BusinessApplication = {
  businessName: string;
  category: string;
  description: string;
  addressOrServiceArea: string;
  city: string;
  state: string;
  zipCode: string;
  businessPhone: string;
  publicBusinessEmail: string;
  instagram: string;
  website: string;
  googleBusinessListing: string;
  yelpPage: string;
  otherSocialProfile: string;
  verificationMethod: VerificationMethod | null;
  verificationExplanation: string;
  ownershipConfirmed: boolean;
  submittedAt: string;
};
