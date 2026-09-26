import type { BusinessSearchRow } from '@/types/business-search';
import { formatMapDistance, getDistanceMiles, type MapCoordinate } from '@/utils/map-filters';

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function compactText(value: string): string {
  return normalizeText(value).replace(/\s/g, '');
}

export function tokenizeSearchQuery(query: string): string[] {
  return normalizeText(query)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function businessMatchesSearchTokens(row: BusinessSearchRow, tokens: string[]): boolean {
  if (tokens.length === 0) {
    return false;
  }

  const haystack = normalizeText(
    [row.name, row.category, row.city, row.state, row.street_address].filter(Boolean).join(' '),
  );
  const compactHaystack = compactText(haystack);

  return tokens.every((token) => {
    const compactToken = compactText(token);
    return haystack.includes(token) || compactHaystack.includes(compactToken);
  });
}

function scoreRelevance(row: BusinessSearchRow, query: string, tokens: string[]): number {
  const normalizedQuery = normalizeText(query);
  const compactQuery = compactText(query);
  const name = normalizeText(row.name);
  const compactName = compactText(row.name);
  const category = normalizeText(row.category ?? '');
  const location = normalizeText([row.city, row.state].filter(Boolean).join(' '));

  let score = 0;

  if (name === normalizedQuery) {
    score += 120;
  } else if (compactName === compactQuery) {
    score += 115;
  } else if (name.startsWith(normalizedQuery)) {
    score += 95;
  } else if (compactName.includes(compactQuery) && compactQuery.length >= 4) {
    score += 85;
  } else if (tokens.length > 0 && tokens.every((token) => name.includes(token))) {
    score += 75;
  } else if (name.includes(normalizedQuery)) {
    score += 65;
  } else if (tokens.some((token) => name.includes(token))) {
    score += 50;
  }

  if (category.includes(normalizedQuery) || tokens.some((token) => category.includes(token))) {
    score += 25;
  }

  if (location && (location.includes(normalizedQuery) || tokens.some((token) => location.includes(token)))) {
    score += 15;
  }

  if (tokens.length > 0 && businessMatchesSearchTokens(row, tokens)) {
    score += 10;
  }

  return score;
}

export function rankBusinessSearchResults(
  rows: BusinessSearchRow[],
  query: string,
  origin: MapCoordinate | null,
): BusinessSearchRow[] {
  const tokens = tokenizeSearchQuery(query);
  const filtered = rows.filter((row) => businessMatchesSearchTokens(row, tokens));

  return filtered
    .map((row) => {
      const relevance = scoreRelevance(row, query, tokens);
      let distanceMiles: number | null = null;

      if (
        origin &&
        row.latitude !== null &&
        row.longitude !== null &&
        !Number.isNaN(row.latitude) &&
        !Number.isNaN(row.longitude)
      ) {
        distanceMiles = getDistanceMiles(origin, {
          latitude: row.latitude,
          longitude: row.longitude,
        });
      }

      const distanceBoost =
        distanceMiles === null ? 0 : Math.max(0, 35 - Math.min(distanceMiles, 350) * 0.08);

      const sortScore =
        relevance >= 70
          ? relevance * 10_000 + distanceBoost
          : relevance * 1_000 + distanceBoost;

      return {
        row,
        relevance,
        distanceMiles,
        sortScore,
      };
    })
    .sort((left, right) => {
      if (right.sortScore !== left.sortScore) {
        return right.sortScore - left.sortScore;
      }

      return left.row.name.localeCompare(right.row.name);
    })
    .map(({ row, distanceMiles }) => ({
      ...row,
      distanceMiles,
      distanceLabel: distanceMiles === null ? null : formatMapDistance(distanceMiles),
    }));
}

export function sanitizeSearchQueryForIlike(query: string): string {
  return query
    .trim()
    .replace(/[%_,()\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
