export type BusinessProfileForm = {
  name: string;
  category: string;
  description: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
};

export type BusinessProfileFormErrors = Partial<Record<keyof BusinessProfileForm, string>>;

export const EMPTY_BUSINESS_PROFILE_FORM: BusinessProfileForm = {
  name: '',
  category: '',
  description: '',
  streetAddress: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  email: '',
  website: '',
  instagram: '',
};
