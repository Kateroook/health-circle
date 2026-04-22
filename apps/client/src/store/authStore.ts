import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { ApiError, apiFetch } from "../api/api";

// Secure storage for Expo
const secureStorage: StateStorage = {
  getItem: async (name: string) => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => SecureStore.deleteItemAsync(name),
};

interface User {
  id: string;
  email: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName?: string;
  phone: string | null;
  avatarUpdatedAt?: string;
  status: "SAFE" | "DANGER" | "UNKNOWN" | "WAS_SAFE";
  region?: string | null;
  district?: string | null;
  alertRegionUid?: number | null;
  smsCode?: string;
  smsTargetNumber?: string;
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
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  completeOnboarding: () => void;
  updateUser: (data: Partial<User>) => void;
}

const VALID_USER_STATUSES = new Set<User["status"]>(["SAFE", "DANGER", "UNKNOWN", "WAS_SAFE"]);

const resolveUserStatus = (
  status?: Partial<User>["status"],
  fallback: User["status"] = "UNKNOWN",
): User["status"] =>
  VALID_USER_STATUSES.has(status as User["status"]) ? (status as User["status"]) : fallback;

const normalizeUser = (profile: Partial<User>, currentUser?: User | null): User =>
  ({
    ...(currentUser ?? {}),
    ...(profile as Partial<User>),
    status: resolveUserStatus(profile.status, currentUser?.status ?? "UNKNOWN"),
  }) as User;

const isAuthFailure = (error: unknown): error is ApiError =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

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
        const currentUser = get().user;

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
            user: normalizeUser(profile as Partial<User>, currentUser),
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
                user: normalizeUser(profile as Partial<User>),
                loading: false,
                isLoggedIn: true,
              });
              return;
            } catch {}
          }

          if (isAuthFailure(error)) {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              loading: false,
              isLoggedIn: false,
            });
            return;
          }

          set({
            user: currentUser,
            loading: false,
            isLoggedIn: true,
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
      login: async (identifier, password) => {
        try {
          const res = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ identifier, password }),
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
          set({ user: normalizeUser(data, currentUser) });
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
        user: state.user,
      }),

      // Refresh profile on startup
      onRehydrateStorage: () => {
        return (state) => {
          state?.refreshProfile();
        };
      },
    },
  ),
);
