import type { BusinessApplication, VerificationMethod } from '@/types/account-mode';

export const VERIFICATION_METHOD_OPTIONS: {
  id: VerificationMethod;
  label: string;
}[] = [
  { id: 'official_business_email', label: 'Official business email' },
  { id: 'business_license', label: 'Business license' },
  { id: 'sellers_permit', label: "Seller's permit" },
  { id: 'utility_bill', label: 'Utility bill showing business name' },
  { id: 'storefront_photos', label: 'Storefront, stand, menu, or workspace photos' },
  { id: 'official_social_media', label: 'Official social media account' },
  { id: 'other_proof', label: 'Other supporting proof' },
];

export const EMPTY_BUSINESS_APPLICATION: Omit<BusinessApplication, 'submittedAt'> = {
  businessName: '',
  category: '',
  description: '',
  addressOrServiceArea: '',
  city: '',
  state: '',
  zipCode: '',
  businessPhone: '',
  publicBusinessEmail: '',
  instagram: '',
  website: '',
  googleBusinessListing: '',
  yelpPage: '',
  otherSocialProfile: '',
  verificationMethod: null,
  verificationExplanation: '',
  ownershipConfirmed: false,
};

export function hasOnlinePresence(application: Pick<BusinessApplication, keyof typeof EMPTY_BUSINESS_APPLICATION>): boolean {
  return [
    application.instagram,
    application.website,
    application.googleBusinessListing,
    application.yelpPage,
    application.otherSocialProfile,
  ].some((value) => value.trim().length > 0);
}

export function validateBusinessApplication(
  application: Omit<BusinessApplication, 'submittedAt'>,
): string | null {
  if (!application.businessName.trim()) {
    return 'Business name is required.';
  }
  if (!application.category.trim()) {
    return 'Business category is required.';
  }
  if (!application.city.trim()) {
    return 'City is required.';
  }
  if (!application.businessPhone.trim() && !application.publicBusinessEmail.trim()) {
    return 'Provide a business phone number or public business email.';
  }
  if (!hasOnlinePresence(application) && !application.verificationMethod) {
    return 'Add at least one online presence field or choose a verification method.';
  }
  if (application.verificationMethod && !application.verificationExplanation.trim()) {
    return 'Describe the proof you can provide for your selected verification method.';
  }
  if (!application.ownershipConfirmed) {
    return 'Please confirm that you own this business or are authorized to manage it.';
  }
  return null;
}
