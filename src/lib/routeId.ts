/**
 * BG-66 (ARK-266): id numérico que llega en la URL (`/ediciones-pasadas/:editionId/juegos`, `/play-game/:id`,
 * `?edicion=`). Devuelve el número solo si es un entero positivo; si no, `null` y la pantalla no llama a la API
 * (antes `/ediciones-pasadas/abc/juegos` mandaba `NaN` y el back respondía 500).
 */
export function parseRouteId(value: string | null | undefined): number | null {
  if (!value || !/^\d+$/.test(value.trim())) return null;
  const id = Number(value.trim());
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
