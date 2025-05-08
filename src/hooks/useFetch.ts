// hooks/useFetch.ts (CORREGIDO)

import { useAuth } from "@/contexts/AuthContext.tsx";
import { useCallback } from "react";

export function useFetch() {
  const { accessToken, refreshAccessToken, logout } = useAuth();

  const fetchWrapper = useCallback(
    async (input: RequestInfo, init: RequestInit = {}): Promise<Response> => {
      const currentAccessToken = accessToken;

      let response = await fetch(input, {
        ...init,
        credentials: "include",
        headers: {
          ...init.headers,

          ...(currentAccessToken
            ? { Authorization: `Bearer ${currentAccessToken}` }
            : {}),
        },
      });

      if (response.status === 401) {
        try {
          const newAccessToken = await refreshAccessToken();

          if (!newAccessToken) {
            console.error("refreshAccessToken did not return a new token.");
            logout();
            throw new Error("Failed to obtain new token after refresh.");
          }

          response = await fetch(input, {
            ...init,
            credentials: "include",
            headers: {
              ...init.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        } catch (refreshError: any) {
          console.error("useFetch failed to refresh token:", refreshError);
          logout();

          throw new Error(
            `Session refresh failed: ${refreshError.message || "Unauthorized"}`
          );
        }
      }

      return response;
    },
    [accessToken, refreshAccessToken, logout]
  );

  return fetchWrapper;
}
