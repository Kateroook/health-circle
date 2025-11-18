import { apiFetch } from "@/lib/api";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null; // store access token
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await apiFetch("/auth/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setAccessToken(res.accessToken); // store token
    await refreshProfile();
  }

  async function logout() {
    await apiFetch("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});

    setAccessToken(null);
    setUser(null);
  }

  useEffect(() => {
    refreshProfile();
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{ user, loading, accessToken, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
