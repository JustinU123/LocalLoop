/** Display label for a comment/review author when profile name is missing. */
export function formatCommentAuthorDisplayName(
  displayName: string | null | undefined,
  authorUserId: string,
): string {
  const trimmed = displayName?.trim();
  if (trimmed) {
    return trimmed;
  }
  return `Member ${authorUserId.slice(0, 6)}`;
}
