/** Reject source assets larger than this before compression (bytes). */
export const BUSINESS_BRANDING_SOURCE_MAX_BYTES = 25 * 1024 * 1024;

export const BUSINESS_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const BUSINESS_COVER_MAX_BYTES = 5 * 1024 * 1024;

export const BUSINESS_LOGO_MAX_EDGE_PX = 1024;
export const BUSINESS_COVER_MAX_WIDTH_PX = 2400;

export const BUSINESS_BRANDING_JPEG_QUALITY = 0.85;

export const ALLOWED_BUSINESS_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const;

/** Profile picture / logo vs public profile banner. */
export type BusinessBrandingImageKind = 'logo' | 'cover';
