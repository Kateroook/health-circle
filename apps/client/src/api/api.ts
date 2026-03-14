const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api"
    : "http://34.116.132.120:3001/api");

export async function apiFetch(
  path: string,
  options: RequestInit & {
    headers?: Record<string, string | number>;
    token?: string;
    _isRetry?: boolean;
  } = {},
) {
  const url = `${API_URL}${path}`;

  const { useAuthStore } = require("../store/authStore");
  // Get token from store if not provided manually
  const token = options.token || useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(Object.entries(options.headers || {}).map(([k, v]) => [k, String(v)])),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (__DEV__) {
    console.log(`[apiFetch] → ${url}`, {
      method: options.method || "GET",
      body: options.body ? tryParse(options.body) : undefined,
      headers,
    });
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();

  if (__DEV__) {
    console.log(`[apiFetch] ← ${res.status} ${res.statusText}`, {
      ok: res.ok,
      url,
      preview: previewJson(text),
    });
  }

  if (!res.ok) {
    // Auto-refresh on 401: try to refresh the session and retry the request once
    if (res.status === 401 && !options._isRetry) {
      const { useAuthStore } = require("../store/authStore");
      const refreshed = await useAuthStore.getState().refreshSession();
      if (refreshed) {
        // Retry with new access token
        const newToken = useAuthStore.getState().accessToken;
        const retryHeaders: Record<string, string> = {
          ...headers,
        };
        if (newToken) {
          retryHeaders["Authorization"] = `Bearer ${newToken}`;
        }
        return apiFetch(path, {
          ...options,
          headers: retryHeaders,
          _isRetry: true,
        });
      }
    }
    throw new Error(text || res.statusText);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    if (__DEV__) console.log("[apiFetch] JSON parse error:", err);
    return null;
  }
}

function previewJson(text: string, limit = 5000) {
  try {
    const obj = JSON.parse(text);
    const pretty = JSON.stringify(obj, null, 2);
    return pretty.length > limit ? pretty.slice(0, limit) + " ...[truncated]" : pretty;
  } catch {
    return text.length > limit ? text.slice(0, limit) + " ...[truncated]" : text;
  }
}

function tryParse(str: unknown) {
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return str;
  }
}

export async function apiUploadFile(
  path: string,
  file: { uri: string; name: string; type: string },
) {
  const formData = new FormData();
  formData.append("file", file as any);

  if (__DEV__) {
    console.log(`[apiUploadFile] → ${API_URL}${path}`, { file });
  }

  const res = await apiFetch(path, {
    method: "PUT",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (__DEV__) {
    console.log(`[apiUploadFile] ← Success`, { path });
  }

  return res;
}

export function getAvatarUrl(userId: string, timestamp?: string | number | Date) {
  let url = `${API_URL}/users/${userId}/avatar`;
  if (timestamp) {
    url += `?t=${new Date(timestamp).getTime()}`;
  }
  if (__DEV__) console.log(`[getAvatarUrl] → ${url}`);
  return url;
}

export async function updateMyStatus(status: "SAFE" | "DANGER" | "UNKNOWN" | "WAS_SAFE") {
  return apiFetch("/users/status", {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function saveFcmTokenToBackend(token: string) {
  return apiFetch("/users/fcm-token", {
    method: "PUT",
    body: JSON.stringify({ token }),
  });
}

export async function updateUserLocation(locationData: {
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
}) {
  const { useAuthStore } = require("../store/authStore");
  const user = useAuthStore.getState().user;
  if (!user?.id) return;

  return apiFetch("/users", {
    method: "PUT",
    body: JSON.stringify({
      id: user.id,
      ...locationData,
    }),
  });
}
