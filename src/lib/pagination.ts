/** Tope de `limit` que acepta el backend en los listados paginados (`MAX_PAGE_LIMIT`). */
export const MAX_PAGE_LIMIT = 100;

export interface FetchedPage<T> {
  items: T[];
  totalPages: number;
}

/**
 * Trae una lista completa recorriendo sus páginas, porque el backend responde 400 si se le piden
 * más de {@link MAX_PAGE_LIMIT} por página. Si una página falla, el error se propaga.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<FetchedPage<T>>,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const { items, totalPages } = await fetchPage(page, MAX_PAGE_LIMIT);
    all.push(...items);
    if (items.length === 0 || page >= totalPages) return all;
  }
}

/**
 * BG-66 (ARK-266): estado de los controles de paginación. Una lista vacía es «Página 1 de 1» con «anterior» y
 * «siguiente» deshabilitados (antes salía «Página 0 de 0» y en algunas pantallas «siguiente» quedaba habilitado).
 */
export interface PageStatus {
  page: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
}

export function pageStatus(currentPage: number | null | undefined, totalPages: number | null | undefined): PageStatus {
  const total = Math.max(1, Math.floor(Number(totalPages) || 0));
  const page = Math.min(total, Math.max(1, Math.floor(Number(currentPage) || 1)));
  return { page, totalPages: total, canPrev: page > 1, canNext: page < total };
}

/** «1 de 1», «2 de 5» */
export function pageLabel(currentPage: number | null | undefined, totalPages: number | null | undefined): string {
  const { page, totalPages: total } = pageStatus(currentPage, totalPages);
  return `${page} de ${total}`;
}
