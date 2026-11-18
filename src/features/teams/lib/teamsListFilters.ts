import type { TeamOrigin } from "@/features/teams/api/editionStudents";

/** Pestañas de Equipos Inscritos: «Todos» no manda `origin` al back. */
export type TeamOriginFilter = "all" | TeamOrigin;

/** Espera antes de mandar la búsqueda al back (BG-53): no una petición por tecla. */
export const TEAMS_SEARCH_DEBOUNCE_MS = 300;

/** Opciones numéricas del selector «Filas». */
export const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20] as const;

/**
 * Límite que se pide con «Filas: Todos». El back lo recorta a su tope (1000) y responde
 * `itemsPerPage: 1000`, así que el selector no puede buscar este número literal.
 */
export const ALL_ROWS_LIMIT = 999999;

/**
 * Valor del selector «Filas» para un `itemsPerPage`. Lo que no es una opción numérica
 * (999999 pedido, 1000 recortado por el back) es «Todos» (BG-53: antes quedaba en blanco).
 */
export function rowsSelectValue(itemsPerPage: number | undefined): string {
  const n = itemsPerPage ?? 10;
  return (ROWS_PER_PAGE_OPTIONS as readonly number[]).includes(n) ? String(n) : "all";
}

/** Límite a pedir para un valor del selector «Filas». */
export function limitFromRowsValue(value: string): number {
  return value === "all" ? ALL_ROWS_LIMIT : parseInt(value, 10);
}
