/** Separadores que pueden quedar entre el código y el nombre: «N1-ABC-1001 - Nombre», «[N1-ABC-1001] Nombre». */
const SEPARATORS = /^[\s\-–—:|·.]+/;
/** Código de equipo de la feria (`N<nivel>-…`, p. ej. «N10-ABC-1001», «N0-COL-12»), solo o entre corchetes/paréntesis. */
const TEAM_CODE_PREFIX = /^[[(]?N\d{1,2}(?:-[A-Z0-9]+)+[\])]?(?=[\s\-–—:|·.])/i;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * BG-66 (ARK-266): en las ediciones 2025-10 y 2025-30 los nombres de los juegos y equipos se importaron con el
 * código del equipo delante («N1-ABC-1001 - Mi juego»). Quita ese código, sea el del propio equipo o uno con la
 * forma de los códigos de la feria. Si al quitarlo no queda nada, deja el nombre como estaba.
 */
export function stripTeamCodePrefix(name: string | null | undefined, teamCode?: string | null): string {
  const original = (name ?? "").trim();
  if (!original) return original;

  let rest: string | null = null;
  const code = teamCode?.trim();
  if (code) {
    const own = new RegExp(`^[[(]?${escapeRegExp(code)}[\\])]?(?=$|[\\s\\-–—:|·.])`, "i");
    if (own.test(original)) rest = original.replace(own, "");
  }
  if (rest === null && TEAM_CODE_PREFIX.test(original)) rest = original.replace(TEAM_CODE_PREFIX, "");
  if (rest === null) return original;

  const cleaned = rest.replace(SEPARATORS, "").trim();
  return cleaned || original;
}
