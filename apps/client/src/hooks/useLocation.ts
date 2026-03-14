import { useEffect } from "react";
import { useLocationStore } from "../store/locationStore";
import * as Location from "expo-location";
import { updateUserLocation } from "../api/api";

export const useLocation = () => {
  const { updateCurrentLocation, requestPermissions, coords, setGeographicInfo } =
    useLocationStore();

  useEffect(() => {
    const initLocation = async () => {
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      if (currentStatus === Location.PermissionStatus.UNDETERMINED) {
        await requestPermissions();
      } else if (currentStatus === Location.PermissionStatus.GRANTED) {
        await updateCurrentLocation();
      }
    };

    initLocation();
  }, [updateCurrentLocation, requestPermissions]);

  useEffect(() => {
    if (!coords) return;

    const syncLocation = async () => {
      try {
        // Reverse geocoding to get region/district
        const [address] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        const region = address?.region || address?.city || null;
        const district = address?.district || address?.subregion || null;

        setGeographicInfo({ region, district });

        // Sync to backend
        await updateUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          region: region || undefined,
          district: district || undefined,
        });
      } catch (err) {
        console.error("Failed to sync location to server:", err);
      }
    };

    syncLocation();
  }, [coords, setGeographicInfo]);
};
