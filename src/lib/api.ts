export async function apiFetch(url: string, options: RequestInit = {}) {
  // 1. Configuramos opciones por defecto para incluir cookies en todas las peticiones (DRY)
  const defaultOptions: RequestInit = {
    credentials: "include",
    ...options,
  };

  // [MODIFICACIÓN]: Constantes para controlar los reintentos en errores de servidor (5xx) o de red.
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 1000;

  let response: Response;

  // [MODIFICADO]: Se implementa el bucle de reintento SOLO para la petición inicial y errores 5xx/red.
  // [ANTES]: La lógica de 401 estaba dentro de este bucle, lo que causaba múltiples intentos de refresco si había errores 5xx.
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await fetch(url, defaultOptions);

      // Si detectamos un error 5xx, reintentamos antes de procesar el resultado
      if (response.status >= 500 && response.status <= 599 && attempt < MAX_RETRIES) {
        console.warn(
          `Error ${response.status} detectado en ${url}. Reintentando en ${RETRY_DELAY_MS}ms... (Intento ${attempt + 1}/${MAX_RETRIES})`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue; // Siguiente intento
      }
      break; // Salimos del bucle si no hay error 5xx o agotamos reintentos
    } catch (error) {
      // Captura de errores de red para reintento
      if (attempt < MAX_RETRIES) {
        console.error(`Fallo de conexión. Reintentando... (${attempt + 1}/${MAX_RETRIES})`, error);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      throw error;
    }
  }

  // --- INICIO MECANISMO REFRESH TOKEN (Restaurado a su funcionamiento original) ---
  // [MODIFICADO]: Este bloque ahora vive fuera del bucle de reintentos 5xx para asegurar que solo se intente refrescar una vez.
  // [ANTES]: Estaba integrado en el bucle de reintentos.
  const isAuthRoute = url.includes("/auth/");
  if (response!.status === 401 && !isAuthRoute) {
    console.warn("401 detectado. Intentando refrescar sesión automáticamente...");
    try {
      // Intentamos renovar el token llamando al endpoint de refresh
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/refresh`,
        { method: "POST", credentials: "include" },
      );

      if (refreshResponse.ok) {
        console.log("Refresco exitoso. Reintentando la petición original...");
        // Reintentamos la petición original tal cual estaba antes de la modificación (una sola vez post-refresh)
        response = await fetch(url, defaultOptions);
      }
    } catch (error) {
      console.error("Error en el proceso de autorecuperación:", error);
    }
  }
  // --- FIN MECANISMO REFRESH TOKEN ---

  // 3. ¡MUY IMPORTANTE!: Devolver la respuesta al que llamó a la función
  return response!;
}
