/**
 * Ruta a la que vuelve /calificar-lote (sin juegos, o al terminar).
 * El rol manda: el Profesor solo puede entrar a /colegios-calificar y el Jurado
 * a /pendientes-calificar. Sin rol conocido se usa el origen recibido.
 */
export function getBatchBackRoute(
  from: string | undefined,
  role: string | null | undefined,
): string {
  if (role === "Profesor") return "/colegios-calificar";
  if (role === "Jurado") return "/pendientes-calificar";
  return from === "colegios" ? "/colegios-calificar" : "/pendientes-calificar";
}
