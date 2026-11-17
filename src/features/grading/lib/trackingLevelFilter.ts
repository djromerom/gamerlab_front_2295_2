/**
 * BG-59 (ARK-259): deja solo los grupos del nivel elegido en el panel de seguimiento.
 * La tabla por hora se arma con los grupos de /absence-alert/panel, que no recibe
 * el nivel; por eso se filtra aquí con `group.level`. Sin nivel se devuelven todos.
 */
export function filterGroupsByLevel<T extends { level: string | null }>(
  groups: readonly T[],
  level: string | null | undefined,
): T[] {
  if (!level) return [...groups];
  const wanted = level.toUpperCase();
  return groups.filter((group) => group.level?.toUpperCase() === wanted);
}
