import { useAuthStore } from "../store/authStore";

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
  } = {}
) {
  const url = `${API_URL}${path}`;

  // Get token from store if not provided manually
  const token = options.token || useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(
      Object.entries(options.headers || {}).map(([k, v]) => [k, String(v)])
    ),
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
      preview: text.slice(0, 250),
    });
  }

  if (!res.ok) {
    throw new Error(text || res.statusText);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    if (__DEV__) console.log("[apiFetch] JSON parse error:", err);
    return null;
  }
}

function tryParse(str: unknown) {
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return str;
  }
}
