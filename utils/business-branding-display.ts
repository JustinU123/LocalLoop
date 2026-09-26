/** Trimmed public branding URL, or null when empty. */
export function trimBrandingUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/**
 * Consumer avatar / business logo.
 * Priority: logo_url → legacy fallback (e.g. latest post) → '' (UI shows initials).
 */
export function resolveBusinessLogoUrl(params: {
  logoUrl?: string | null;
  legacyFallback?: string | null;
}): string {
  return trimBrandingUrl(params.logoUrl) ?? trimBrandingUrl(params.legacyFallback) ?? '';
}

/**
 * Consumer hero / cover / wide imagery.
 * Priority: cover_image_url → logo_url → legacy fallback → '' (UI shows neutral/initials).
 */
export function resolveBusinessCoverUrl(params: {
  coverUrl?: string | null;
  logoUrl?: string | null;
  legacyFallback?: string | null;
}): string {
  return (
    trimBrandingUrl(params.coverUrl) ??
    trimBrandingUrl(params.logoUrl) ??
    trimBrandingUrl(params.legacyFallback) ??
    ''
  );
}
