export function formatProfileRatingDisplay(rating: number): string {
  const safe = Number.isFinite(rating) ? rating : 0;
  return `${safe.toFixed(1)}/5`;
}

export function formatProfileCount(count: number): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (safe >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (safe >= 1_000) {
    return `${(safe / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${safe}`;
}
