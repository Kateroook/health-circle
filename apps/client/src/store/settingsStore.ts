import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

const secureStorage: StateStorage = {
  getItem: async (name: string) => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => SecureStore.deleteItemAsync(name),
};

interface SettingsState {
  isPushEnabled: boolean;
  hasPromptedForNotifications: boolean;
  setPushEnabled: (enabled: boolean) => void;
  setHasPromptedForNotifications: (prompted: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isPushEnabled: true,
      hasPromptedForNotifications: false,
      setPushEnabled: (enabled) => set({ isPushEnabled: enabled }),
      setHasPromptedForNotifications: (prompted) => set({ hasPromptedForNotifications: prompted }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
