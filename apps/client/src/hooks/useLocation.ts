import { useEffect } from "react";
import { useLocationStore } from "../store/locationStore";
import * as Location from "expo-location";
import { updateUserLocation } from "../api/api";

export const useLocation = () => {
  const { updateCurrentLocation, requestPermissions } = useLocationStore();

  useEffect(() => {
    const initLocation = async () => {
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

      if (currentStatus === Location.PermissionStatus.UNDETERMINED) {
        const granted = await requestPermissions();
        if (granted) {
          await updateCurrentLocation();
        }
      } else if (currentStatus === Location.PermissionStatus.GRANTED) {
        await updateCurrentLocation();
      }
    };

    initLocation();
  }, [updateCurrentLocation, requestPermissions]);
};
