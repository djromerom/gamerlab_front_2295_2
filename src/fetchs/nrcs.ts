/** ARK-136 (BG-23): `GET /nrcs` de una edición. Sin `editionId` el back devuelve la activa. */
export function nrcsUrl(
  apiBase: string,
  params: { page: number; limit: number; editionId?: number },
): string {
  const search = new URLSearchParams();
  search.set('page', String(params.page));
  search.set('limit', String(params.limit));
  if (params.editionId) search.set('editionId', String(params.editionId));
  return `${apiBase}/nrcs?${search.toString()}`;
}

/** Texto de ayuda de la página de NRC: el orden para preparar una edición. */
export const NRC_ORDER_HINT =
  'Orden recomendado: crea y activa la edición, carga aquí sus NRC y después abre las inscripciones en Configuración de Evento.';
