import { create } from "zustand";
import * as Location from "expo-location";

interface LocationState {
  coords: {
    latitude: number;
    longitude: number;
  } | null;
  accuracy: number | null;
  timestamp: number | null;
  permissionStatus: Location.PermissionStatus | null;
  region: string | null;
  district: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setLocation: (location: Location.LocationObject) => void;
  setPermissionStatus: (status: Location.PermissionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  requestPermissions: () => Promise<boolean>;
  updateCurrentLocation: () => Promise<void>;
  setGeographicInfo: (info: { region: string | null; district: string | null }) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: null,
  accuracy: null,
  timestamp: null,
  permissionStatus: null,
  region: null,
  district: null,
  loading: false,
  error: null,

  setLocation: (location) => {
    set({
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    });
  },

  setGeographicInfo: (info: { region: string | null; district: string | null }) => {
    set({
      region: info.region,
      district: info.district,
    });
  },

  setPermissionStatus: (status) => set({ permissionStatus: status }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  requestPermissions: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      set({ permissionStatus: status });
      return status === Location.PermissionStatus.GRANTED;
    } catch (err) {
      console.error("Failed to request location permissions:", err);
      set({ error: "Failed to request permissions" });
      return false;
    }
  },

  updateCurrentLocation: async () => {
    const { loading } = get();
    if (loading) return;

    set({ loading: true, error: null });

    let status: Location.PermissionStatus;
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      status = permission.status;

      if (status !== Location.PermissionStatus.GRANTED) {
        const granted = await get().requestPermissions();
        if (!granted) {
          throw new Error("LOCATION_PERMISSION_DENIED");
        }
        status = Location.PermissionStatus.GRANTED;
      }
    } catch (err: any) {
      set({ loading: false });
      if (err.message === "LOCATION_PERMISSION_DENIED") throw err;
      console.error("Permission check failed:", err);
      throw new Error("LOCATION_FETCH_FAILED");
    }

    set({ permissionStatus: status });

    // Fast-First approach: show last known position immediately
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        get().setLocation(lastKnown);
      }
    } catch (err) {
      console.warn("Failed to get last known position:", err);
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      get().setLocation(location);

      try {
        const { updateUserLocation } = require("../api/api");
        await updateUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (syncErr) {
        console.error("Failed to sync location to backend:", syncErr);
      }
    } catch (err) {
      console.error("Failed to get current position:", err);
      set({ error: "Failed to get current location" });
    } finally {
      set({ loading: false });
    }
  },
}));
