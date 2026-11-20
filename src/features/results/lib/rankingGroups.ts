/**
 * Nombres y textos del ranking oficial por nivel (HU-04).
 * ARK-273 (back ARK-272): ya no existe el grupo «Externos» (decisión del 16-nov): todo equipo
 * compite en su nivel, N0 a N4, tenga o no la casilla «Externo», que queda como dato informativo.
 */

/** Nombre de un nivel, empate o decisión: «N{nivel}». */
export function groupLabel(group: { level: number }): string {
  return `N${group.level}`;
}

/** Texto del cierre del ranking. */
export function finalizeSummary(result: { teams: number; levels: unknown[] }): string {
  const levels = result.levels.length;
  return `Ranking final definido: ${result.teams} grupos en ${levels} ${levels === 1 ? "nivel" : "niveles"}.`;
}
