// hooks/useFetch.ts (CORREGIDO)

import { useAuth } from "@/contexts/AuthContext.tsx";
import { useCallback } from "react"; // <-- Asegúrate de importar useCallback

export function useFetch() {
  // Obtenemos las funciones y valores necesarios del contexto de autenticación
  const { accessToken, refreshAccessToken, logout } = useAuth();

  // Usamos useCallback para memorizar la función fetchWrapper.
  // Esta función solo se volverá a crear si alguna de sus dependencias
  // (accessToken, refreshAccessToken, logout) cambia.
  const fetchWrapper = useCallback(
    async (
      input: RequestInfo, // La URL u objeto Request
      init: RequestInit = {} // Opciones iniciales de fetch (opcional)
    ): Promise<Response> => {
      // Guardamos el token actual para asegurarnos de usar el mismo en esta ejecución
      const currentAccessToken = accessToken;

      // Opcional: Log para depurar qué token se está usando
      // console.log('useFetch executing. AccessToken present:', !!currentAccessToken);

      // 1. Intenta la petición inicial con el token de acceso actual
      let response = await fetch(input, {
        ...init, // Incluye cualquier opción pasada (method, body, etc.)
        credentials: "include", // Mantenlo si tu API lo requiere o si usas cookies para algo más
        headers: {
          ...init.headers, // Incluye cualquier cabecera pasada
          // Añade la cabecera Authorization solo si existe un token
          ...(currentAccessToken
            ? { Authorization: `Bearer ${currentAccessToken}` }
            : {}),
        },
      });

      // 2. Si la respuesta es 401 (Unauthorized), el token probablemente expiró.
      if (response.status === 401) {
        // Opcional: Log para depurar el intento de refresh
        // console.log('useFetch received 401. Attempting token refresh...');
        try {
          // Intenta refrescar el token usando la función del contexto Auth
          const newAccessToken = await refreshAccessToken();

          // Verifica si se obtuvo un nuevo token
          if (!newAccessToken) {
            console.error("refreshAccessToken did not return a new token.");
            logout(); // Si no hay token nuevo, deslogueamos
            throw new Error("Failed to obtain new token after refresh.");
          }

          // Opcional: Log de éxito del refresh
          // console.log('useFetch token refreshed. Retrying original request...');

          // Reintenta la petición original EXACTAMENTE igual, pero con el nuevo token
          response = await fetch(input, {
            ...init,
            credentials: "include",
            headers: {
              ...init.headers,
              Authorization: `Bearer ${newAccessToken}`, // Usa el NUEVO token
            },
          });

          // Opcional: Log del resultado del reintento
          // console.log('useFetch retry request status:', response.status);
        } catch (refreshError: any) {
          // Si el refresh falla (ej: refresh token inválido o error de red)
          console.error("useFetch failed to refresh token:", refreshError);
          logout(); // Desloguea al usuario porque no se pudo refrescar
          // Lanza un error para que la llamada original falle y se pueda manejar
          throw new Error(
            `Session refresh failed: ${refreshError.message || "Unauthorized"}`
          );
        }
      }

      // Devuelve la respuesta final (sea la original o la del reintento)
      return response;
    },
    [accessToken, refreshAccessToken, logout]
  ); // <-- Dependencias de useCallback

  // El hook useFetch devuelve la función fetchWrapper memorizada
  return fetchWrapper;
}
