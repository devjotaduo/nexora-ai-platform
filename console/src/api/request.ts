import { getApiUrl, clearAuthToken } from "./config";
import { buildAuthHeaders } from "./authHeaders";
import { useAgentStore } from "../stores/agentStore";

let _resettingAgent = false;

function resetToValidAgent() {
  if (_resettingAgent) return;
  _resettingAgent = true;
  const store = useAgentStore.getState();
  store.setSelectedAgent("default");
  fetch(getApiUrl("/agents"), {
    headers: new Headers(buildAuthHeaders()),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.agents) store.setAgents(data.agents);
    })
    .catch(() => {})
    .finally(() => {
      _resettingAgent = false;
    });
}

function getErrorMessageFromBody(
  text: string,
  contentType: string,
): string | null {
  if (!text) {
    return null;
  }

  if (!contentType.includes("application/json")) {
    return text;
  }

  try {
    const payload = JSON.parse(text) as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };

    if (typeof payload.detail === "string" && payload.detail) {
      return payload.detail;
    }
    if (typeof payload.message === "string" && payload.message) {
      return payload.message;
    }
    if (typeof payload.error === "string" && payload.error) {
      return payload.error;
    }
  } catch {
    return text;
  }

  return text;
}

function buildHeaders(
  method?: string,
  extra?: HeadersInit,
  hasBody = false,
): Headers {
  // Normalize extra to a Headers instance for consistent handling
  const headers = extra instanceof Headers ? extra : new Headers(extra);

  // Only add Content-Type when the request carries a JSON body.
  if (
    method &&
    (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) || hasBody)
  ) {
    // Don't override if caller explicitly set Content-Type
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  for (const [key, value] of Object.entries(buildAuthHeaders())) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return headers;
}

export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = getApiUrl(path);
  const method = options.method || "GET";
  const headers = buildHeaders(method, options.headers, options.body != null);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Not authenticated");
    }

    const text = await response.text().catch(() => "");
    const contentType = response.headers.get("content-type") || "";
    const errorMessage = getErrorMessageFromBody(text, contentType);

    if (response.status === 403 && errorMessage === "Agent access denied") {
      resetToValidAgent();
    }

    // Preserve raw body for parseErrorDetail() to extract structured fields
    const finalMessage = errorMessage
      ? `${errorMessage} - ${text}`
      : `Request failed: ${response.status} ${response.statusText}`;

    throw new Error(finalMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as unknown as T;
  }

  return (await response.json()) as T;
}
