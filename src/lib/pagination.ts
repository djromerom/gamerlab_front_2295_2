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
