import {
  BUSINESS_BRANDING_SOURCE_MAX_BYTES,
  BUSINESS_COVER_MAX_BYTES,
  BUSINESS_COVER_MAX_WIDTH_PX,
  BUSINESS_LOGO_MAX_BYTES,
  BUSINESS_LOGO_MAX_EDGE_PX,
  ALLOWED_BUSINESS_IMAGE_EXTENSIONS,
  type BusinessBrandingImageKind,
} from '@/constants/business-branding';

export function maxOutputBytesForKind(kind: BusinessBrandingImageKind): number {
  return kind === 'logo' ? BUSINESS_LOGO_MAX_BYTES : BUSINESS_COVER_MAX_BYTES;
}

export function isAllowedBusinessImageExtension(extension: string): boolean {
  const normalized = extension.replace(/^\./, '').toLowerCase();
  return (ALLOWED_BUSINESS_IMAGE_EXTENSIONS as readonly string[]).includes(normalized);
}

export function validateSourceByteSize(byteLength: number): string | null {
  if (!Number.isFinite(byteLength) || byteLength <= 0) {
    return 'This image could not be read. Try choosing a different photo.';
  }
  if (byteLength > BUSINESS_BRANDING_SOURCE_MAX_BYTES) {
    return 'This image is too large. Choose a photo under 25 MB.';
  }
  return null;
}

export function validateOutputByteSize(byteLength: number, kind: BusinessBrandingImageKind): string | null {
  const maxBytes = maxOutputBytesForKind(kind);
  if (byteLength > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    const label = kind === 'logo' ? 'profile picture' : 'banner';
    return `This image is still too large after processing. Use a smaller photo (max ${maxMb} MB for ${label}).`;
  }
  return null;
}

export type ResizePlan = {
  resizeWidth?: number;
  resizeHeight?: number;
};

/** Compute expo-image-manipulator resize action for logo or cover. */
export function buildResizePlan(
  kind: BusinessBrandingImageKind,
  width: number,
  height: number,
): ResizePlan {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return {};
  }

  if (kind === 'logo') {
    const maxEdge = BUSINESS_LOGO_MAX_EDGE_PX;
    const longest = Math.max(width, height);
    if (longest <= maxEdge) {
      return {};
    }
    const scale = maxEdge / longest;
    return {
      resizeWidth: Math.round(width * scale),
      resizeHeight: Math.round(height * scale),
    };
  }

  const maxWidth = BUSINESS_COVER_MAX_WIDTH_PX;
  if (width <= maxWidth) {
    return {};
  }
  const scale = maxWidth / width;
  return {
    resizeWidth: Math.round(width * scale),
    resizeHeight: Math.round(height * scale),
  };
}
