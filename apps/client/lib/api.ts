const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://your-production-api.com");

export async function apiFetch(
  path: string,
  options: RequestInit & {
    headers?: Record<string, string | number>;
    token?: string;
  } = {}
) {
  const url = `${API_URL}${path}`;

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(
      Object.entries(options.headers || {}).map(([k, v]) => [k, String(v)])
    ),
  };

  // Add bearer token if provided
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
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

// Helper to safely parse JSON request body
function tryParse(str: unknown) {
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return str;
  }
}
