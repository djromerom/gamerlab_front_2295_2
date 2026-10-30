import { SESSION_EXPIRED_EVENT } from "@/lib/session";

export class SessionRejectedError extends Error {}

type AuthHandlers = {
  accessToken?: string | null;
  refreshAccessToken?: () => Promise<string | null>;
  logout?: () => void | Promise<void>;
};

const MAX_TRANSIENT_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1_000;

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, durationMs));

function requestMethod(input: RequestInfo | URL, options: RequestInit) {
  const requestMethod = typeof Request !== "undefined" && input instanceof Request ? input.method : "GET";
  return (options.method ?? requestMethod).toUpperCase();
}

function canRetry(method: string, headers: Headers) {
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  // Only retry a write when the server explicitly supports idempotency keys.
  return headers.has("Idempotency-Key");
}

function buildOptions(options: RequestInit, token?: string | null): RequestInit {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", ["Bearer", token].join(" "));
  return { ...options, credentials: options.credentials ?? "include", headers };
}

async function sendWithTransientRetries(
  input: RequestInfo | URL,
  options: RequestInit,
  retryAllowed: boolean,
): Promise<Response> {
  const method = requestMethod(input, options);
  const headers = new Headers(options.headers);
  const shouldRetry = retryAllowed && canRetry(method, headers);

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(input, options);
      if (response.status < 500 || response.status > 599 || !shouldRetry || attempt >= MAX_TRANSIENT_RETRIES) {
        return response;
      }
    } catch (error) {
      if (!shouldRetry || attempt >= MAX_TRANSIENT_RETRIES || (error instanceof DOMException && error.name === "AbortError")) {
        if (error instanceof TypeError && shouldRetry) {
          const requestError = new Error("No pudimos completar la acción, inténtalo de nuevo");
          (requestError as Error & { cause?: unknown }).cause = error;
          throw requestError;
        }
        throw error;
      }
    }

    await wait(INITIAL_RETRY_DELAY_MS * 2 ** attempt);
  }
}

async function renewAccessToken(auth: AuthHandlers): Promise<string | null> {
  if (auth.refreshAccessToken) return auth.refreshAccessToken();

  const refreshUrl = `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/refresh`;
  const response = await fetch(refreshUrl, { method: "POST", credentials: "include" });
  if (response.status === 401 || response.status === 403) {
    throw new SessionRejectedError("Refresh token rejected");
  }
  if (!response.ok) return null;
  const data = await response.json();
  return typeof data?.accessToken === "string" ? data.accessToken : null;
}

export async function apiFetch(
  input: RequestInfo | URL,
  options: RequestInit = {},
  auth: AuthHandlers = {},
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const isAuthRoute = url.includes("/auth/");
  const firstRequest = buildOptions(options, auth.accessToken);
  let response = await sendWithTransientRetries(input, firstRequest, true);

  if (response.status !== 401 || isAuthRoute) return response;

  try {
    const refreshedToken = await renewAccessToken(auth);
    if (!refreshedToken) {
      return response;
    }

    // Authentication recovery is attempted once. The refreshed request can
    // still retry transient failures when its method is safe/idempotent.
    response = await sendWithTransientRetries(input, buildOptions(options, refreshedToken), true);
    return response;
  } catch (error) {
    if (error instanceof SessionRejectedError) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      await auth.logout?.();
      return response;
    }
    const refreshError = new Error(error instanceof Error
      ? `No pudimos renovar tu sesión: ${error.message}`
      : "No pudimos renovar tu sesión");
    (refreshError as Error & { cause?: unknown }).cause = error;
    throw refreshError;
  }
}
