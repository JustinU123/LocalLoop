/** Compact display for like/comment counts (matches Explore post cards). */
export function formatEngagementCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${count}`;
}
