export async function apiFetch(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: "include",
    ...options,
  };

  let response = await fetch(url, defaultOptions);

  // 2. Interceptor de error 401
  if (response.status === 401) {
    console.warn("401 detectado. Intentando refrescar sesión...");
    try {
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/refresh`,
        { method: "POST", credentials: "include" },
      );

      if (refreshResponse.ok) {
        console.log("Refresco exitoso. Reintentando petición original...");
        // Reintentamos la petición original y actualizamos la variable response
        response = await fetch(url, defaultOptions);
      }
    } catch (error) {
      console.error("Error en el proceso de autorecuperación:", error);
    }
  }

  // 3. ¡MUY IMPORTANTE!: Devolver la respuesta al que llamó a la función
  return response;
}
