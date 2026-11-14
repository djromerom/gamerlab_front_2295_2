export interface CriterionRef {
  id: number;
  name: string;
}

export interface CriterionColumn {
  id: number | string;
  name: string;
}

type WithCriterios = { criterios?: Record<string, number> | null };

/**
 * Columnas de criterios para tablas y gráficos: salen de GET /criteria
 * ordenadas por id, de modo que un criterio renombrado sigue mostrándose.
 * Si la lista no está disponible, se derivan de las claves de los datos.
 */
export function buildCriteriaColumns(
  criteria: CriterionRef[],
  videojuegos: WithCriterios[],
): CriterionColumn[] {
  if (criteria.length > 0) {
    return [...criteria]
      .sort((a, b) => a.id - b.id)
      .map((c) => ({ id: c.id, name: c.name.trim() }));
  }
  const names: string[] = [];
  for (const v of videojuegos) {
    for (const key of Object.keys(v.criterios ?? {})) {
      const name = key.trim();
      if (!names.includes(name)) names.push(name);
    }
  }
  return names.map((name) => ({ id: name, name }));
}

export function getCriterionValue(
  criterios: Record<string, number> | null | undefined,
  column: CriterionColumn,
): number | undefined {
  if (!criterios || typeof criterios !== "object") return undefined;
  for (const [key, value] of Object.entries(criterios)) {
    if (key.trim() === column.name) return value;
  }
  return undefined;
}
