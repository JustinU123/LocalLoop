import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Linking } from 'react-native';

import { DEFAULT_MAP_CENTER } from '@/data/map-businesses';
import { RADIUS_OPTIONS, type RadiusOption } from '@/data/promotions';

export const DEFAULT_SEARCH_RADIUS: RadiusOption = 15;

export type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

type LocationSettingsContextValue = {
  permissionGranted: boolean;
  cityLabel: string | null;
  coordinates: LocationCoordinates;
  searchRadius: RadiusOption;
  isRefreshing: boolean;
  setSearchRadius: (radius: RadiusOption) => void;
  refreshLocation: () => Promise<void>;
  openSystemSettings: () => void;
};

const LocationSettingsContext = createContext<LocationSettingsContextValue | null>(null);

function formatCityLabel(address: Location.LocationGeocodedAddress): string {
  const city =
    address.city ?? address.subregion ?? address.district ?? address.name ?? 'Unknown City';
  const region = address.region?.trim() ?? '';

  if (!region) {
    return city;
  }

  if (region.length === 2) {
    return `${city}, ${region.toUpperCase()}`;
  }

  return `${city}, ${region}`;
}

export function LocationSettingsProvider({ children }: { children: ReactNode }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cityLabel, setCityLabel] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<LocationCoordinates>(DEFAULT_MAP_CENTER);
  const [searchRadius, setSearchRadiusState] = useState<RadiusOption>(DEFAULT_SEARCH_RADIUS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshLocation = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setPermissionGranted(false);
        setCityLabel(null);
        return;
      }

      setPermissionGranted(true);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCoordinates(nextCoordinates);

      const results = await Location.reverseGeocodeAsync(nextCoordinates);
      const firstResult = results[0];

      if (firstResult) {
        setCityLabel(formatCityLabel(firstResult));
      } else {
        setCityLabel(null);
      }
    } catch {
      setPermissionGranted(false);
      setCityLabel(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const setSearchRadius = useCallback((radius: RadiusOption) => {
    if (radius === searchRadius) return;
    if (!RADIUS_OPTIONS.includes(radius)) return;
    Haptics.selectionAsync();
    setSearchRadiusState(radius);
  }, [searchRadius]);

  const openSystemSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const value = useMemo(
    () => ({
      permissionGranted,
      cityLabel,
      coordinates,
      searchRadius,
      isRefreshing,
      setSearchRadius,
      refreshLocation,
      openSystemSettings,
    }),
    [
      permissionGranted,
      cityLabel,
      coordinates,
      searchRadius,
      isRefreshing,
      setSearchRadius,
      refreshLocation,
      openSystemSettings,
    ],
  );

  return (
    <LocationSettingsContext.Provider value={value}>{children}</LocationSettingsContext.Provider>
  );
}

export function useLocationSettings() {
  const context = useContext(LocationSettingsContext);
  if (!context) {
    throw new Error('useLocationSettings must be used within LocationSettingsProvider');
  }
  return context;
}
