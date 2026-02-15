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
  id: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  avatarUpdatedAt?: string;
  status: "SAFE" | "DANGER" | "UNKNOWN";
}

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;

  // onboarding flag
  hasCompletedOnboarding: boolean;

  // derived state
  isLoggedIn: boolean;

  // actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  completeOnboarding: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
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
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });

          set({
            user: profile as User,
            loading: false,
            isLoggedIn: true,
          });
        } catch (error) {
          console.error("Profile fetch failed, trying refresh:", error);

          // Try refreshing the session before giving up
          const refreshed = await get().refreshSession();
          if (refreshed) {
            // Retry profile fetch with new token
            try {
              const newToken = get().accessToken;
              const profile = await apiFetch("/auth/profile", {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              set({
                user: profile as User,
                loading: false,
                isLoggedIn: true,
              });
              return;
            } catch {}
          }

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            loading: false,
            isLoggedIn: false,
          });
        }
      },

      // Refresh the session using the refresh token
      refreshSession: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) return false;

        try {
          const res = await apiFetch("/auth/refresh", {
            method: "POST",
            token: currentRefreshToken,
          });

          if (res.accessToken && res.refreshToken) {
            set({
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Session refresh failed:", error);
          return false;
        }
      },

      // Login
      login: async (email, password) => {
        try {
          const res = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
          });

          if (!res.accessToken) {
            throw new Error("Failed to get access token.");
          }

          // store both tokens
          set({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken || null,
          });

          // fetch profile
          await get().refreshProfile();

          set({
            isLoggedIn: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
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
          refreshToken: null,
          loading: false,
          isLoggedIn: false,
        });
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

      updateUser: (data) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
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
