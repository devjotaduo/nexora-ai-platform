declare const VITE_API_BASE_URL: string;
declare const TOKEN: string;

const AUTH_TOKEN_KEY = "qwenpaw_auth_token";
let memoryAuthToken = "";

/**
 * Get the full API URL with /api prefix
 * @param path - API path (e.g., "/models", "/skills")
 * @returns Full API URL (e.g., "http://localhost:8088/api/models" or "/api/models")
 */
export function getApiUrl(path: string): string {
  const base =
    typeof VITE_API_BASE_URL !== "undefined" ? VITE_API_BASE_URL : "";
  const apiPrefix = "/api";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${apiPrefix}${normalizedPath}`;
}

/**
 * Get the API token - checks localStorage first (auth login),
 * then falls back to the build-time TOKEN constant.
 * @returns API token string or empty string
 */
export function getApiToken(): string {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY)
        : "";
    if (stored) return stored;
  } catch {
    // Some embedded browser contexts can restrict localStorage.
  }
  if (memoryAuthToken) return memoryAuthToken;
  return typeof TOKEN !== "undefined" ? TOKEN : "";
}

/**
 * Store the auth token in localStorage after login.
 */
export function setAuthToken(token: string): void {
  memoryAuthToken = token;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {
    // Keep the in-memory token for the current session.
  }
}

/**
 * Remove the auth token from localStorage (logout / 401).
 */
export function clearAuthToken(): void {
  memoryAuthToken = "";
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Nothing else to clear.
  }
}
