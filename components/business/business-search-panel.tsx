import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BusinessSearchResultRow } from '@/components/business/business-search-result-row';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { searchDiscoverableBusinesses } from '@/services/businessSearch';
import type { BusinessSearchResult } from '@/types/business-search';
import type { MapCoordinate } from '@/utils/map-filters';

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

type BusinessSearchPanelProps = {
  query: string;
  origin: MapCoordinate | null;
  onPressBusiness?: (businessId: string) => void;
};

export function BusinessSearchPanel({ query, origin, onPressBusiness }: BusinessSearchPanelProps) {
  const styles = useThemedStyles(createStyles);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [results, setResults] = useState<BusinessSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedQuery = debouncedQuery.trim();
  const isActive = trimmedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!isActive) {
      setResults([]);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setLoading(true);
      setErrorMessage(null);

      const result = await searchDiscoverableBusinesses(trimmedQuery, origin);

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (!result.ok) {
        setResults([]);
        setErrorMessage(result.message);
        return;
      }

      setResults(result.results);
    }

    void runSearch();

    return () => {
      cancelled = true;
    };
  }, [isActive, trimmedQuery, origin?.latitude, origin?.longitude]);

  if (!isActive) {
    return null;
  }

  if (loading && results.length === 0) {
    return (
      <View style={styles.stateBlock}>
        <ActivityIndicator color={styles.loadingIndicator.color} />
        <Text style={styles.stateText}>Searching local businesses…</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.stateBlock}>
        <Text style={styles.errorTitle}>Unable to search</Text>
        <Text style={styles.stateText}>{errorMessage}</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.stateBlock}>
        <Text style={styles.emptyTitle}>No local businesses found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.results}>
      {results.map((business) => (
        <BusinessSearchResultRow
          key={business.id}
          business={business}
          onPressBusiness={onPressBusiness}
        />
      ))}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    results: {
      paddingTop: 4,
    },
    stateBlock: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 28,
      paddingHorizontal: 24,
    },
    loadingIndicator: {
      color: theme.emerald,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    errorTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    stateText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
