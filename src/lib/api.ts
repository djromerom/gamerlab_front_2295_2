export async function apiFetch(url: string, options: RequestInit = {}) {
  // 1. Configuramos opciones por defecto para incluir cookies en todas las peticiones (DRY)
  const defaultOptions: RequestInit = {
    credentials: "include",
    ...options,
  };

  let response = await fetch(url, defaultOptions);

  // [MODIFICADO]: Se agregó una condición para ignorar los endpoints de autenticación y evitar bucles infinitos en el login/logout
  // [ANTES]: if (response.status === 401) {
  const isAuthRoute = url.includes("/auth/");
  if (response.status === 401 && !isAuthRoute) {
    console.warn("401 detectado. Intentando refrescar sesión automáticamente...");
    try {
      // Intentamos renovar el token llamando al endpoint de refresh
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/refresh?silent=true`,
        { method: "POST", credentials: "include" },
      );

      if (refreshResponse.ok) {
        console.log("Refresco exitoso. Reintentando la petición original que falló...");
        // Si el refresh funcionó, reintentamos la petición original exactamante como era
        response = await fetch(url, defaultOptions);
      }
    } catch (error) {
      console.error("Error en el proceso de autorecuperación:", error);
    }
  }

  // 3. ¡MUY IMPORTANTE!: Devolver la respuesta al que llamó a la función
  return response;
}
