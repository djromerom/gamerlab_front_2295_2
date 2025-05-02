import { useAuth } from "@/contexts/AuthContext.tsx";

export function useFetch() {
  const { accessToken, refreshAccessToken, logout } = useAuth();

  return async function (
    input: RequestInfo,
    init: RequestInit = {}
  ): Promise<Response> {
    // 1. Primera petición con accessToken en header
    let res = await fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...init.headers,
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
    });

    // 2. Si expira (401), intento refrescar y reintento
    if (res.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        res = await fetch(input, {
          ...init,
          credentials: "include",
          headers: {
            ...init.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch {
        logout();
        throw new Error("No autorizado");
      }
    }

    return res;
  };
}
