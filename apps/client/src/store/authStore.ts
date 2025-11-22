import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { apiFetch } from "../api/api";

// Secure storage for Expo
const secureStorage: StateStorage = {
  getItem: async (name: string) => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) =>
    SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => SecureStore.deleteItemAsync(name),
};

interface User {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
}

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;

  // onboarding flag
  hasCompletedOnboarding: boolean;

  // derived state
  isLoggedIn: boolean;

  // actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      loading: true,
      hasCompletedOnboarding: false,
      isLoggedIn: false,

      refreshProfile: async () => {
        const token = get().accessToken;

        if (!token) {
          set({
            user: null,
            loading: false,
            isLoggedIn: false,
          });
          return;
        }

        try {
          const profile = await apiFetch("/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            user: profile as User,
            loading: false,
            isLoggedIn: true,
          });
        } catch (error) {
          console.error("Token refresh failed:", error);

          set({
            user: null,
            accessToken: null,
            loading: false,
            isLoggedIn: false,
          });
        }
      },

      // Login
      login: async (email, password) => {
        set({ loading: true });

        const res = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.accessToken) {
          set({ loading: false });
          throw new Error("Failed to get access token.");
        }

        // store token
        set({ accessToken: res.accessToken });

        // fetch profile
        await get().refreshProfile();

        set({
          isLoggedIn: true,
          loading: false,
        });
      },

      // Logout
      logout: async () => {
        const token = get().accessToken;

        if (token) {
          await apiFetch("/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        set({
          user: null,
          accessToken: null,
          loading: false,
          hasCompletedOnboarding: false,
          isLoggedIn: false,
        });
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),

      // Refresh profile on startup
      onRehydrateStorage: () => {
        return (state) => {
          state?.refreshProfile();
        };
      },
    }
  )
);
