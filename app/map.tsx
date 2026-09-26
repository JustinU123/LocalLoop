import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapBusinessMarker } from '@/components/map/map-business-marker';
import { MapBusinessPreview } from '@/components/map/map-business-preview';
import { MapChainPreview } from '@/components/map/map-chain-preview';
import { MapFilterSheet } from '@/components/map/map-filter-sheet';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useSavedItems } from '@/contexts/saved-items-context';
import { DEFAULT_MAP_CENTER } from '@/data/map-businesses';
import type { MapBusiness } from '@/data/map-businesses';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { fetchMapChainPins } from '@/services/mapChainPlaces';
import { getMapBusinesses } from '@/services/mapBusinesses';
import type { MapChainPin, MapPinWithDistance } from '@/types/map-pin';
import { isMapChainPinWithDistance, isMapLocalPinWithDistance } from '@/types/map-pin';
import { mapBusinessWithDistanceToSavedBusiness } from '@/utils/map-business-save';
import { toMapLocalPins } from '@/utils/map-local-pin';
import { toMapBusinessWithDistance } from '@/utils/map-local-pin-preview';
import { countLocalPinsOnMap, mergeAndFilterMapPins } from '@/utils/map-pin-filters';
import { openBusinessProfile } from '@/utils/open-business-profile';
import {
  DEFAULT_MAP_FILTERS,
  regionsAreDifferent,
  type MapFilters,
} from '@/utils/map-filters';

const INITIAL_DELTA = {
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function MapScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const suppressMapPressRef = useRef(false);
  const { isBusinessSaved, toggleBusinessSaved } = useSavedItems();

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [userLocation, setUserLocation] = useState(DEFAULT_MAP_CENTER);
  const [searchOrigin, setSearchOrigin] = useState(DEFAULT_MAP_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_MAP_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPinWithDistance | null>(null);
  const [mapChainPins, setMapChainPins] = useState<MapChainPin[]>([]);
  const [loadingChainPins, setLoadingChainPins] = useState(false);
  const [chainPinsError, setChainPinsError] = useState<string | null>(null);
  const [visibleRegion, setVisibleRegion] = useState<Region>({
    ...DEFAULT_MAP_CENTER,
    ...INITIAL_DELTA,
  });
  const [searchedRegion, setSearchedRegion] = useState<Region>({
    ...DEFAULT_MAP_CENTER,
    ...INITIAL_DELTA,
  });
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [mapBusinesses, setMapBusinesses] = useState<MapBusiness[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [businessesError, setBusinessesError] = useState<string | null>(null);
  const hasLoadedBusinessesRef = useRef(false);
  const [markerTracksViewChanges, setMarkerTracksViewChanges] = useState(true);

  const loadMapBusinesses = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoadingBusinesses(true);
    }

    const result = await getMapBusinesses();

    if (mode === 'initial') {
      setLoadingBusinesses(false);
    }

    if (!result.ok) {
      setBusinessesError(result.message);
      if (__DEV__) {
        console.error('[map:loadMapBusinesses]', result.message);
      }
      return;
    }

    setBusinessesError(null);
    setMapBusinesses(result.businesses);
    setMarkerTracksViewChanges(true);
  }, []);

  useEffect(() => {
    if (mapBusinesses.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setMarkerTracksViewChanges(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [mapBusinesses]);

  useFocusEffect(
    useCallback(() => {
      const mode = hasLoadedBusinessesRef.current ? 'refresh' : 'initial';
      void loadMapBusinesses(mode).finally(() => {
        hasLoadedBusinessesRef.current = true;
      });
    }, [loadMapBusinesses]),
  );

  useEffect(() => {
    let mounted = true;

    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;

        if (permission.status !== 'granted') {
          setLocationDenied(true);
          setUserLocation(DEFAULT_MAP_CENTER);
          setSearchOrigin(DEFAULT_MAP_CENTER);
          setVisibleRegion({ ...DEFAULT_MAP_CENTER, ...INITIAL_DELTA });
          setSearchedRegion({ ...DEFAULT_MAP_CENTER, ...INITIAL_DELTA });
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) return;

        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(nextLocation);
        setSearchOrigin(nextLocation);
        const nextRegion = { ...nextLocation, ...INITIAL_DELTA };
        setVisibleRegion(nextRegion);
        setSearchedRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 500);
      } catch {
        if (!mounted) return;
        setLocationDenied(true);
        setUserLocation(DEFAULT_MAP_CENTER);
        setSearchOrigin(DEFAULT_MAP_CENTER);
      } finally {
        if (mounted) {
          setLoadingLocation(false);
        }
      }
    }

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  const localPins = useMemo(() => toMapLocalPins(mapBusinesses), [mapBusinesses]);

  useEffect(() => {
    if (!filters.includeChains) {
      setMapChainPins([]);
      setChainPinsError(null);
      setLoadingChainPins(false);
      return;
    }

    let cancelled = false;
    setLoadingChainPins(true);
    setChainPinsError(null);

    void fetchMapChainPins({
      origin: searchOrigin,
      radiusMiles: filters.distanceMiles,
      category: filters.category,
      openNow: filters.openNow,
    }).then((result) => {
      if (cancelled) {
        return;
      }

      setLoadingChainPins(false);

      if (result.ok) {
        setMapChainPins(result.pins);
        setChainPinsError(null);
        setMarkerTracksViewChanges(true);
      } else {
        setMapChainPins([]);
        setChainPinsError(result.message);
        if (__DEV__) {
          console.error('[map:fetchMapChainPins]', result.message);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    filters.includeChains,
    filters.distanceMiles,
    searchOrigin.latitude,
    searchOrigin.longitude,
  ]);

  useEffect(() => {
    if (!filters.includeChains && selectedPin && isMapChainPinWithDistance(selectedPin)) {
      setSelectedPin(null);
    }
  }, [filters.includeChains, selectedPin]);

  const filteredPins = useMemo(
    () =>
      mergeAndFilterMapPins({
        localPins,
        chainPins: mapChainPins,
        origin: searchOrigin,
        query: searchQuery,
        filters,
      }),
    [filters, localPins, mapChainPins, searchOrigin, searchQuery],
  );

  const visibleLocalCount = useMemo(() => countLocalPinsOnMap(filteredPins), [filteredPins]);

  useEffect(() => {
    if (selectedPin && !filteredPins.some((pin) => pin.id === selectedPin.id)) {
      setSelectedPin(null);
    }
  }, [filteredPins, selectedPin]);

  const handleMarkerPress = useCallback((pin: MapPinWithDistance) => {
    suppressMapPressRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPin(pin);
    setMarkerTracksViewChanges(true);
    setTimeout(() => {
      suppressMapPressRef.current = false;
      setMarkerTracksViewChanges(false);
    }, 350);
  }, []);

  const handleMapPress = useCallback(() => {
    if (suppressMapPressRef.current) {
      return;
    }
    setSelectedPin(null);
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      setVisibleRegion(region);
      setShowSearchArea(regionsAreDifferent(region, searchedRegion));
    },
    [searchedRegion],
  );

  const handleSearchArea = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchOrigin({
      latitude: visibleRegion.latitude,
      longitude: visibleRegion.longitude,
    });
    setSearchedRegion(visibleRegion);
    setShowSearchArea(false);
    setSelectedPin(null);
  }, [visibleRegion]);

  const handleRecenter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const region = { ...userLocation, ...INITIAL_DELTA };
    mapRef.current?.animateToRegion(region, 450);
    setSearchOrigin(userLocation);
    setSearchedRegion(region);
    setVisibleRegion(region);
    setShowSearchArea(false);
    setSelectedPin(null);
  }, [userLocation]);

  const handleViewBusiness = useCallback((pin: MapPinWithDistance) => {
    if (!isMapLocalPinWithDistance(pin)) {
      return;
    }
    openBusinessProfile(pin.profileId, { source: 'map' });
  }, []);

  const handleToggleSave = useCallback(
    (pin: MapPinWithDistance) => {
      if (!isMapLocalPinWithDistance(pin)) {
        return;
      }
      toggleBusinessSaved(mapBusinessWithDistanceToSavedBusiness(toMapBusinessWithDistance(pin)));
    },
    [toggleBusinessSaved],
  );

  const selectedLocalPin = selectedPin && isMapLocalPinWithDistance(selectedPin) ? selectedPin : null;
  const selectedChainPin =
    selectedPin && isMapChainPinWithDistance(selectedPin) ? selectedPin : null;

  const savedState = selectedLocalPin ? isBusinessSaved(selectedLocalPin.profileId) : false;

  const showFoursquareAttribution =
    filters.includeChains &&
    (loadingChainPins || mapChainPins.length > 0 || Boolean(selectedChainPin) || Boolean(chainPinsError));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...DEFAULT_MAP_CENTER, ...INITIAL_DELTA }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={!locationDenied}
        showsMyLocationButton={false}
        userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
        onPress={handleMapPress}>
        {filteredPins.map((pin) => (
          <Marker
            key={pin.id}
            identifier={pin.id}
            tappable
            coordinate={{
              latitude: pin.latitude,
              longitude: pin.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={markerTracksViewChanges || selectedPin?.id === pin.id}
            onPress={(event) => {
              if (typeof event.stopPropagation === 'function') {
                event.stopPropagation();
              }
              handleMarkerPress(pin);
            }}>
            <MapBusinessMarker pin={pin} selected={selectedPin?.id === pin.id} />
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <Text style={styles.screenTitle}>Map</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search local businesses"
              placeholderTextColor={theme.textSecondary}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFiltersVisible(true);
            }}
            style={({ pressed }) => [styles.filterButton, pressed && styles.controlPressed]}>
            <Ionicons name="options-outline" size={20} color={theme.emerald} />
          </Pressable>
        </View>

        {locationDenied ? (
          <View style={styles.locationBanner}>
            <Ionicons name="location-outline" size={16} color={theme.coral} />
            <Text style={styles.locationBannerText}>
              Location access denied. Distance uses the map center until you enable location.
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {visibleLocalCount} local business{visibleLocalCount === 1 ? '' : 'es'}
            </Text>
          </View>
          {loadingChainPins ? (
            <ActivityIndicator size="small" color={theme.emerald} />
          ) : null}
          {showSearchArea ? (
            <Pressable
              onPress={handleSearchArea}
              style={({ pressed }) => [styles.searchAreaButton, pressed && styles.controlPressed]}>
              <Text style={styles.searchAreaText}>Search this area</Text>
            </Pressable>
          ) : null}
        </View>

        {chainPinsError && filters.includeChains ? (
          <View style={styles.chainErrorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.chainErrorText} numberOfLines={2}>
              National chains unavailable. Local businesses still shown.
            </Text>
          </View>
        ) : null}

        {showFoursquareAttribution ? (
          <Text style={styles.foursquareAttribution}>Powered by Foursquare</Text>
        ) : null}
      </SafeAreaView>

      <View
        style={[styles.bottomControls, { bottom: insets.bottom + 16 }]}
        pointerEvents="box-none">
        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => [styles.recenterButton, pressed && styles.controlPressed]}>
          <Ionicons name="locate" size={22} color={theme.emerald} />
        </Pressable>

        {selectedLocalPin ? (
          <View pointerEvents="auto">
            <MapBusinessPreview
              business={toMapBusinessWithDistance(selectedLocalPin)}
              saved={savedState}
              onToggleSave={() => handleToggleSave(selectedLocalPin)}
              onViewBusiness={() => handleViewBusiness(selectedLocalPin)}
              onClose={() => setSelectedPin(null)}
            />
          </View>
        ) : selectedChainPin ? (
          <View pointerEvents="auto">
            <MapChainPreview pin={selectedChainPin} onClose={() => setSelectedPin(null)} />
          </View>
        ) : businessesError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Unable to load map businesses</Text>
            <Text style={styles.emptyText}>{businessesError}</Text>
            <Pressable
              onPress={() => {
                void loadMapBusinesses('initial');
              }}
              style={({ pressed }) => [styles.retryButton, pressed && styles.controlPressed]}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : visibleLocalCount === 0 &&
          filteredPins.length === 0 &&
          !loadingLocation &&
          !loadingBusinesses ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No businesses match</Text>
            <Text style={styles.emptyText}>
              Try widening your distance, changing categories, or searching a different area.
            </Text>
          </View>
        ) : null}
      </View>

      {loadingLocation || loadingBusinesses ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator color={theme.emerald} size="large" />
          <Text style={styles.loadingText}>
            {loadingLocation ? 'Finding your location…' : 'Loading local businesses…'}
          </Text>
        </View>
      ) : null}

      <MapFilterSheet
        visible={filtersVisible}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersVisible(false)}
      />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowCard,
    },
    screenTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    topBarSpacer: {
      width: 40,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...theme.shadowCard,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
      padding: 0,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowCard,
    },
    locationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      marginHorizontal: 20,
      backgroundColor: theme.coralGlow,
      borderWidth: 1,
      borderColor: theme.coral,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    locationBannerText: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.medium,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    countPill: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...theme.shadowCard,
    },
    countText: {
      color: theme.text,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    chainErrorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      marginHorizontal: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chainErrorText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: BrandFonts.medium,
    },
    foursquareAttribution: {
      marginTop: 6,
      marginHorizontal: 20,
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.medium,
    },
    searchAreaButton: {
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 14,
      paddingVertical: 8,
      ...theme.shadowButton,
    },
    searchAreaText: {
      color: theme.onEmerald,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    bottomControls: {
      position: 'absolute',
      left: 20,
      right: 20,
      gap: 12,
      zIndex: 10,
      elevation: 10,
    },
    recenterButton: {
      alignSelf: 'flex-end',
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadowCard,
    },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      ...theme.shadowCard,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      marginBottom: 6,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.imageScrimLight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.medium,
    },
    retryButton: {
      marginTop: 12,
      alignSelf: 'flex-start',
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: theme.onEmerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    controlPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
  });
}
