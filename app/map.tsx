import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { MapFilterSheet } from '@/components/map/map-filter-sheet';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useSavedItems } from '@/contexts/saved-items-context';
import { DEFAULT_MAP_CENTER, MAP_BUSINESSES } from '@/data/map-businesses';
import { getBusinessById } from '@/data/businesses';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { openBusinessProfile } from '@/utils/open-business-profile';
import {
  DEFAULT_MAP_FILTERS,
  filterMapBusinesses,
  regionsAreDifferent,
  type MapBusinessWithDistance,
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
  const [selectedBusiness, setSelectedBusiness] = useState<MapBusinessWithDistance | null>(null);
  const [visibleRegion, setVisibleRegion] = useState<Region>({
    ...DEFAULT_MAP_CENTER,
    ...INITIAL_DELTA,
  });
  const [searchedRegion, setSearchedRegion] = useState<Region>({
    ...DEFAULT_MAP_CENTER,
    ...INITIAL_DELTA,
  });
  const [showSearchArea, setShowSearchArea] = useState(false);

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

  const filteredBusinesses = useMemo(
    () =>
      filterMapBusinesses({
        businesses: MAP_BUSINESSES,
        origin: searchOrigin,
        query: searchQuery,
        filters,
      }),
    [filters, searchOrigin, searchQuery],
  );

  useEffect(() => {
    if (
      selectedBusiness &&
      !filteredBusinesses.some((business) => business.id === selectedBusiness.id)
    ) {
      setSelectedBusiness(null);
    }
  }, [filteredBusinesses, selectedBusiness]);

  const handleMarkerPress = useCallback((business: MapBusinessWithDistance) => {
    suppressMapPressRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBusiness(business);
    setTimeout(() => {
      suppressMapPressRef.current = false;
    }, 100);
  }, []);

  const handleMapPress = useCallback(() => {
    if (suppressMapPressRef.current) {
      return;
    }
    setSelectedBusiness(null);
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
    setSelectedBusiness(null);
  }, [visibleRegion]);

  const handleRecenter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const region = { ...userLocation, ...INITIAL_DELTA };
    mapRef.current?.animateToRegion(region, 450);
    setSearchOrigin(userLocation);
    setSearchedRegion(region);
    setVisibleRegion(region);
    setShowSearchArea(false);
    setSelectedBusiness(null);
  }, [userLocation]);

  const handleViewBusiness = useCallback((business: MapBusinessWithDistance) => {
    if (business.profileId && getBusinessById(business.profileId)) {
      openBusinessProfile(business.profileId);
      return;
    }

    Alert.alert('Business profile coming soon', 'This business profile is not available yet.');
  }, []);

  const handleToggleSave = useCallback(
    (business: MapBusinessWithDistance) => {
      if (!business.profileId) {
        Alert.alert('Save unavailable', 'This business is not on LocalLoop yet.');
        return;
      }

      const profile = getBusinessById(business.profileId);
      if (!profile) {
        Alert.alert('Save unavailable', 'This business is not on LocalLoop yet.');
        return;
      }

      toggleBusinessSaved(profile);
    },
    [toggleBusinessSaved],
  );

  const savedState = selectedBusiness?.profileId
    ? isBusinessSaved(selectedBusiness.profileId)
    : false;

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
        {filteredBusinesses.map((business) => (
          <Marker
            key={business.id}
            identifier={business.id}
            coordinate={{
              latitude: business.latitude,
              longitude: business.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={selectedBusiness !== null}
            onPress={(event) => {
              if (typeof event.stopPropagation === 'function') {
                event.stopPropagation();
              }
              handleMarkerPress(business);
            }}>
            <MapBusinessMarker
              business={business}
              selected={selectedBusiness?.id === business.id}
            />
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
              Location access denied. Showing Los Angeles placeholder businesses.
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {filteredBusinesses.length} local business{filteredBusinesses.length === 1 ? '' : 'es'}
            </Text>
          </View>
          {showSearchArea ? (
            <Pressable
              onPress={handleSearchArea}
              style={({ pressed }) => [styles.searchAreaButton, pressed && styles.controlPressed]}>
              <Text style={styles.searchAreaText}>Search this area</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      <View
        style={[styles.bottomControls, { bottom: insets.bottom + 16 }]}
        pointerEvents="box-none">
        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => [styles.recenterButton, pressed && styles.controlPressed]}>
          <Ionicons name="locate" size={22} color={theme.emerald} />
        </Pressable>

        {selectedBusiness ? (
          <View pointerEvents="auto">
            <MapBusinessPreview
            business={selectedBusiness}
            saved={savedState}
            onToggleSave={() => handleToggleSave(selectedBusiness)}
            onViewBusiness={() => handleViewBusiness(selectedBusiness)}
            onClose={() => setSelectedBusiness(null)}
          />
          </View>
        ) : filteredBusinesses.length === 0 && !loadingLocation ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No businesses match</Text>
            <Text style={styles.emptyText}>
              Try widening your distance, changing categories, or searching a different area.
            </Text>
          </View>
        ) : null}
      </View>

      {loadingLocation ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={theme.emerald} size="large" />
          <Text style={styles.loadingText}>Finding your location…</Text>
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
      ...StyleSheet.absoluteFillObject,
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
    controlPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
  });
}
