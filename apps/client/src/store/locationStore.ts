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
      loading: false,
      error: null,
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
    const { permissionStatus } = get();

    let status = permissionStatus;
    if (!status) {
      status = (await Location.getForegroundPermissionsAsync()).status;
      set({ permissionStatus: status });
    }

    if (status !== Location.PermissionStatus.GRANTED) {
      set({ error: "Location permission not granted" });
      return;
    }

    set({ loading: true });
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      get().setLocation(location);
    } catch (err) {
      console.error("Failed to get current position:", err);
      set({ error: "Failed to get current location", loading: false });
    }
  },
}));
