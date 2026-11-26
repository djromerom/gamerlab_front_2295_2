import type { Jurado } from "@/features/jurors/types/jurors";
import { matchesSearch } from "@/features/jurors/assignment/lib/search";

/**
 * BG-66 (ARK-266): filtro propio de la «Lista de jurados». Antes compartía estado con el filtro de equipos, así que
 * después de pulsar «Suplentes» la lista volvía a abrirse filtrada sin decirlo.
 */
export type JurorListFilter = "todos" | "oficiales" | "suplentes";

export const JUROR_LIST_FILTER_LABEL: Record<Exclude<JurorListFilter, "todos">, string> = {
  oficiales: "Oficiales",
  suplentes: "Suplentes",
};

export function filterJurorsList(jurados: Jurado[], search: string, filter: JurorListFilter): Jurado[] {
  const term = search.trim().toLowerCase();
  return jurados.filter((jurado) => {
    const matchesTerm =
      !term || jurado.name.toLowerCase().includes(term) || jurado.email.toLowerCase().includes(term);
    const matchesType =
      filter === "todos" ||
      (filter === "oficiales" && jurado.tipo === "OFFICIAL") ||
      (filter === "suplentes" && jurado.tipo === "BACKUP");
    return matchesTerm && matchesType;
  });
}

/** «1 Suplente», «3 Suplentes» */
export const countLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/**
 * Búsqueda de la ventana «Asignar Jurado»: por nombre o correo, sin distinguir mayúsculas ni tildes («jose» encuentra
 * a «José»). Cada palabra debe aparecer, en cualquier orden («perez ana» encuentra a «Ana Pérez»).
 */
export function searchJurors(jurados: Jurado[], search: string): Jurado[] {
  return jurados.filter((jurado) => matchesSearch([jurado.name, jurado.email], search));
}
