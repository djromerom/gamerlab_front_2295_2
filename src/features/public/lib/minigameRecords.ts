/**
 * Récords globales de los minijuegos de la landing (HU-52, ARK-316). Reglas puras que repiten las del back (ARK-315)
 * para avisar antes de enviar: alias de 1 a 3 letras o números (como las iniciales de las máquinas arcade), cuándo un
 * puntaje entra al top 5 y cómo se nombra la pista de cada canción de Arkad Jam. También, el aviso de «terminó una
 * partida» que los juegos (Three.js, fuera de React) le mandan a los paneles de récords.
 */

export type MinigameGame = "ARKADASH" | "ARKAD_JAM";

export const TOP_SIZE = 5;
export const ALIAS_MIN_LENGTH = 1;
export const ALIAS_MAX_LENGTH = 3;
/** Puntaje máximo que acepta el back en cada juego */
export const SCORE_CAP: Record<MinigameGame, number> = { ARKADASH: 10_000, ARKAD_JAM: 100_000 };

export const ALIAS_INVALID_MESSAGE = `El alias lleva de ${ALIAS_MIN_LENGTH} a ${ALIAS_MAX_LENGTH} letras o números.`;
/**
 * Alias grosero (MINIGAME_ALIAS_OFFENSIVE: HPT, P7A, WTF…): la lista vive solo en el back, así que el front no la revisa
 * antes; se muestra el mensaje que manda el back y, si no llega, este.
 */
export const ALIAS_OFFENSIVE_MESSAGE = "Elige otro alias: este no se puede mostrar en la pantalla principal.";

// Solo letras y números: sin espacios ni signos
const ALIAS_PATTERN = /^[\p{L}\p{N}]+$/u;

/**
 * El alias como se envía: sin espacios al inicio ni al final y en mayúsculas, como las iniciales de un arcade
 * (el campo ya lo escribe así mientras se teclea)
 */
export function normalizeAlias(alias: string): string {
  return alias.normalize("NFC").trim().toLocaleUpperCase("es");
}

/** Qué tiene de malo el alias (el mensaje para mostrar), o null si se puede enviar */
export function aliasProblem(alias: string): string | null {
  const valor = normalizeAlias(alias);
  const largo = [...valor].length;
  if (largo < ALIAS_MIN_LENGTH || largo > ALIAS_MAX_LENGTH || !ALIAS_PATTERN.test(valor)) return ALIAS_INVALID_MESSAGE;
  return null;
}

/**
 * El puntaje entra al top 5: es posible en ese juego y hay menos de 5 récords o supera al quinto
 * (un empate con el quinto no entra: el que llegó antes conserva el puesto).
 */
export function qualifiesForTop(game: MinigameGame, top: readonly { score: number }[], score: number): boolean {
  if (!Number.isInteger(score) || score < 1 || score > SCORE_CAP[game]) return false;
  return top.length < TOP_SIZE || score > top[TOP_SIZE - 1].score;
}

export type JamInstrument = "guitarra" | "piano" | "bateria";
const JAM_TRACK = /^(guitarra|piano|bateria)-(\d{1,2})$/;

/** Pista de una canción de Arkad Jam: el mismo sufijo del récord local (`arkadjam-guitarra-3` → `guitarra-3`) */
export function jamTrack(instrument: JamInstrument, songIndex: number): string {
  return `${instrument}-${songIndex}`;
}

/** Instrumento e índice de la canción de una pista de Arkad Jam, o null si no lo es */
export function parseJamTrack(track: string | null | undefined): { instrument: JamInstrument; index: number } | null {
  const m = JAM_TRACK.exec(track ?? "");
  return m ? { instrument: m[1] as JamInstrument, index: Number(m[2]) } : null;
}

/** Puntaje con separador de miles (41.250) */
export function formatScore(score: number): string {
  return score.toLocaleString("es-CO");
}

/** Fin de una partida: el juego, la canción (solo Arkad Jam), el puntaje y el mejor personal (localStorage) */
export interface MinigameFinish {
  game: MinigameGame;
  track?: string;
  score: number;
  best?: number;
}

export const MINIGAME_FINISHED_EVENT = "arkad:fin-partida";
export const MINIGAME_RECORD_SAVED_EVENT = "arkad:record-guardado";

/** Lo llaman los juegos al terminar una partida: el panel de la tarjeta de fin pide el top global */
export function announceMinigameFinished(fin: MinigameFinish): void {
  window.dispatchEvent(new CustomEvent<MinigameFinish>(MINIGAME_FINISHED_EVENT, { detail: fin }));
}

/** Se guardó un récord global: la franja del top 5 de la landing se actualiza */
export function announceMinigameRecordSaved(game: MinigameGame): void {
  window.dispatchEvent(new CustomEvent<MinigameGame>(MINIGAME_RECORD_SAVED_EVENT, { detail: game }));
}
