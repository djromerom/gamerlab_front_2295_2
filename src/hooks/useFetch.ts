import { useAuth } from "@/contexts/AuthContext.tsx";
import { apiFetch } from "@/lib/api";
import { useCallback } from "react";

export function useFetch() {
  const { accessToken, refreshAccessToken, logout } = useAuth();

  return useCallback(
    (input: RequestInfo | URL, init: RequestInit = {}) =>
      apiFetch(input, init, { accessToken, refreshAccessToken, logout }),
    [accessToken, refreshAccessToken, logout],
  );
}
