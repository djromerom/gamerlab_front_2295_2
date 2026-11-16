/**
 * Arkad Jam (ARK-233): notas, carriles y repertorio del modo canciones. Datos puros, sin DOM ni audio.
 * Viene del mockup aprobado (mockups/landing-galeria-ferias.html).
 */

export type Instrument = "guitarra" | "piano" | "bateria";
/** [altura en semitonos desde el Do central (o pieza de batería; null = silencio), duración en tiempos, nota de adorno opcional] */
export type Note = number[];
/** [nombre del acorde (C, Am, G7, F#m…), duración en tiempos] */
export type Chord = [string, number];
export type SongStyle = "vals" | "rock" | "arpegio" | "bloque" | "rasgueo" | "banda";
export interface AccompanimentEvent {
  tipo: "piano" | "guitarra" | "cuerdas" | "melodia" | "pianoSeco";
  alto: number;
  beat: number;
  dur: number;
  vol: number;
  retraso: number;
}
export interface Song {
  nombre: string;
  autor: string;
  bpm: number;
  nivel: 1 | 2 | 3 | 4;
  estilo: SongStyle;
  notas: Note[];
  acordes?: Chord[];
  /** melodía que suena de fondo en las canciones de batería */
  tema?: Note[];
  /** acompañamiento escrito para la canción (en vez de generarlo con los acordes) */
  fondo?: () => AccompanimentEvent[];
}
export interface Lane {
  s: number;
  nombre: string;
  tecla: string;
  color: string;
  negra?: boolean;
  entre?: number;
}

export const NOTE_NAMES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'];
export const CHROMATIC_NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si', 'Do'];
export const DRUM_PIECES = ['Bombo', 'Caja', 'Hi-hat', 'Abierto', 'Tom 1', 'Tom 2', 'Tom 3', 'Platillo'];
export const NOTE_COLORS = ['#ff5d73', '#ff9a3d', '#ffd23f', '#5be37d', '#38d6c8', '#4c9bff', '#8a6bff', '#e35dff'];
export const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11, 12], BLACK_KEYS = [1, 3, 6, 8, 10], BLACK_KEY_LABELS = ['Q', 'W', 'R', 'T', 'Y'];
export const frequency = (s) => 261.63 * 2 ** (s / 12); // semitonos desde el Do central
// un carril por nota: semitono (o pieza de batería), nombre, tecla y color
export const FREE_LANES: Record<Instrument, Lane[]> = {
  guitarra: WHITE_KEYS.map((s, i) => ({ s, nombre: NOTE_NAMES[i], tecla: String(i + 1), color: NOTE_COLORS[i] })),
  piano: Array.from({ length: 13 }, (_, s) => {
    const b = WHITE_KEYS.indexOf(s);
    return b >= 0 ? { s, nombre: CHROMATIC_NAMES[s], tecla: String(b + 1), color: NOTE_COLORS[b] }
      : { s, nombre: CHROMATIC_NAMES[s], tecla: BLACK_KEY_LABELS[BLACK_KEYS.indexOf(s)], color: '#c9d6ff', negra: true, entre: WHITE_KEYS.indexOf(s - 1) };
  }),
  bateria: DRUM_PIECES.map((nombre, i) => ({ s: i, nombre, tecla: String(i + 1), color: NOTE_COLORS[i] })),
};
/* ── Repertorio del modo canciones ──
   Cada canción: [altura, duración en tiempos]; null es silencio. La altura es un semitono desde el Do central (puede salir del rango
   de 1 a 8: en modo canciones las teclas son carriles, como en Guitar Hero) o, en la batería, la pieza.
   La dificultad define cuántos carriles se usan: fácil 3, medio 4, difícil 5 y extremo 6; la melodía se reparte en ellos de grave a agudo.
   Guitarra: piezas famosas de dominio público, con una versión rock (Grieg) y una metal (Bach). Piano: melodías de dominio público.
   Cada canción trae sus acordes: de fondo suena piano (en guitarra), guitarra (en piano)
   o ambos (en batería), armonizados con la melodía y con un estilo propio (vals, rock, arpegio, bloque o rasgueo).
   Piano: melodías de dominio público. Batería: ritmos originales. */
export const LEVELS = { 1: { nombre: 'Fácil', carriles: 3, color: '#5be37d' }, 2: { nombre: 'Medio', carriles: 4, color: '#ffd23f' },
  3: { nombre: 'Difícil', carriles: 5, color: '#ff9a3d' }, 4: { nombre: 'Extremo', carriles: 6, color: '#ff5d73' } };
export const LANE_COLORS = { 3: [0, 3, 5], 4: [0, 2, 3, 5], 5: [0, 2, 3, 5, 7], 6: [0, 1, 2, 3, 5, 7] }; // índices de COLORES_NOTA
export const LEVEL_DRUMS = { 3: [0, 1, 2], 4: [0, 1, 2, 7], 5: [0, 1, 2, 4, 7], 6: [0, 1, 2, 4, 5, 7] };   // bombo, caja, hi-hat, toms y platillo
const rep = <T,>(n: number, patron: T[]): T[] => Array.from({ length: n }, () => patron).flat() as T[];
const ROCK = [[0, .5], [2, .5], [1, .5], [2, .5], [0, .5], [0, .5], [1, .5], [2, .5]];
// guitarra: alturas escritas (una octava sobre lo que suena), en semitonos desde el Do central
const ROMANCE = [[11, 1], [11, 1], [11, 1], [11, 1], [9, 1], [7, 1], [7, 1], [6, 1], [4, 1], [4, 1], [7, 1], [11, 1], [16, 1], [16, 1], [16, 1], [16, 1], [14, 1], [12, 1],
  [12, 1], [11, 1], [9, 1], [9, 1], [11, 1], [12, 1]];
const GREENSLEEVES = [[9, 1], [12, 2], [14, 1], [16, 1.5], [18, .5], [16, 1], [14, 2], [11, 1], [7, 1.5], [9, .5], [11, 1], [12, 2], [9, 1], [9, 1.5], [8, .5], [9, 1], [11, 2], [8, 1], [4, 2],
  [9, 1], [12, 2], [14, 1], [16, 1.5], [18, .5], [16, 1], [14, 2], [11, 1], [7, 1.5], [9, .5], [11, 1], [12, 1.5], [11, .5], [9, 1], [8, 1.5], [6, .5], [8, 1], [9, 3]];
// «Para Elisa» (Beethoven, WoO 59), en 3/8: cada compás son 6 semicorcheas (1½ tiempos). Parte A con sus dos finales y la parte B.
const ELISA_A = [[16, .25], [15, .25], [16, .25], [11, .25], [14, .25], [12, .25], [9, .5], [null, .25], [0, .25], [4, .25], [9, .25],
  [11, .5], [null, .25], [4, .25], [8, .25], [11, .25], [12, .5], [null, .25], [4, .25], [16, .25], [15, .25],
  [16, .25], [15, .25], [16, .25], [11, .25], [14, .25], [12, .25], [9, .5], [null, .25], [0, .25], [4, .25], [9, .25],
  [11, .5], [null, .25], [4, .25], [12, .25], [11, .25]];
const ELISA_FIN_1 = [[9, .5], [null, .5], [16, .25], [15, .25]], ELISA_FIN_2 = [[9, .5], [null, .25], [11, .25], [12, .25], [14, .25]];
const ELISA_B = [[16, .75], [7, .25], [17, .25], [16, .25], [14, .75], [5, .25], [16, .25], [14, .25], [12, .75], [4, .25], [14, .25], [12, .25],
  [11, .5], [null, .5], [16, .25], [15, .25]];
const AC_ELISA_A: Chord[] = [['E7', 1.5], ['Am', 1.5], ['E', 1.5], ['Am', 1.5], ['E7', 1.5], ['Am', 1.5], ['E', 1.5]];
const AC_ELISA_B: Chord[] = [['C', 1.5], ['G', 1.5], ['Am', 1.5], ['E', 1.5]];
const REY_MONTANA = [[4, .5], [6, .5], [7, .5], [9, .5], [11, .5], [7, .5], [11, 1], [10, .5], [6, .5], [10, 1], [9, .5], [5, .5], [9, 1],
  [4, .5], [6, .5], [7, .5], [9, .5], [11, .5], [7, .5], [11, .5], [16, .5], [14, .5], [11, .5], [7, .5], [11, .5], [14, 2]];
const TOCATA = [[21, .25], [19, .25], [21, 1.5], [19, .25], [17, .25], [16, .25], [14, .25], [13, 1], [14, 2], [9, .25], [7, .25], [9, 1.5], [4, .5], [5, .5], [1, .5], [2, 2]];
const TOCATA_RIFF = [[2, .25], [5, .25], [9, .25], [14, .25], [17, .25], [14, .25], [9, .25], [5, .25], [1, .25], [4, .25], [7, .25], [13, .25], [16, .25], [13, .25], [7, .25], [4, .25]];
const TURCA = [[11, .25], [9, .25], [8, .25], [9, .25], [12, 1], [14, .25], [12, .25], [11, .25], [12, .25], [16, 1], [17, .25], [16, .25], [15, .25], [16, .25],
  [23, .25], [21, .25], [20, .25], [21, .25], [23, .25], [21, .25], [20, .25], [21, .25], [24, 1]];
// variaciones para alargar las canciones sin que se repitan igual: subir/bajar de octava
const octava = (frase: Note[], k: number): Note[] => frase.map(([v, d, adorno]) => (v === null ? [null, d] : adorno === undefined ? [v + 12 * k, d] : [v + 12 * k, d, adorno + 12 * k]));
const CIERRE_ROMANCE = [[6, 1], [7, 1], [6, 1], [4, 3]];
const HIMNO_A = [[4, 1], [4, 1], [5, 1], [7, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 1], [0, 1], [2, 1], [4, 1], [4, 1.5], [2, .5], [2, 2]];
const HIMNO_A2 = [[4, 1], [4, 1], [5, 1], [7, 1], [7, 1], [5, 1], [4, 1], [2, 1], [0, 1], [0, 1], [2, 1], [4, 1], [2, 1.5], [0, .5], [0, 2]];
const HIMNO_B = [[2, 1], [2, 1], [4, 1], [0, 1], [2, 1], [4, .5], [5, .5], [4, 1], [0, 1], [2, 1], [4, .5], [5, .5], [4, 1], [2, 1], [0, 1], [2, 1], [-5, 2]];
const ESTRELLA_A = [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]];
const ESTRELLA_B = [[7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2]];
const MARCHA = [[0, 1], [2, .5], [2, .5], [1, 1], [2, 1]], MARCHA_FILL = [[0, 1], [1, 2], [0, 1]]; // redoble de caja de 2 tiempos
const FUNK = [[0, .5], [2, .25], [2, .25], [1, .5], [2, .25], [0, .25], [2, .5], [0, .5], [1, .5], [4, .25], [4, .25]];
const REDOBLE = [[4, .25], [4, .25], [5, .25], [5, .25], [4, .25], [5, .25], [1, .25], [1, .25]];
// ── Acordes de cada canción, alineados con la melodía: [acorde, duración en tiempos]. En la batería se repiten en bucle ──
const AC_ROMANCE: Chord[] = [['Em', 12], ['Am', 6], ['D7', 3], ['G', 3]], AC_CIERRE_ROMANCE: Chord[] = [['B7', 3], ['Em', 3]];
const AC_GREEN_1: Chord[] = [['Am', 4], ['D', 3], ['G', 3], ['Em', 3], ['Am', 3], ['E', 6], ['Am', 3]], AC_GREEN_2: Chord[] = [['Am', 3], ['D', 3], ['G', 3], ['Em', 3], ['Am', 3], ['E', 3], ['Am', 3]];
const AC_REY: Chord[] = [['Em', 4], ['F#', 2], ['F', 2], ['Em', 4], ['G', 4]];
const AC_TOCATA: Chord[] = [['Dm', 2], ['A7', 2], ['Dm', 2], ['Dm', 2], ['A7', 1.5], ['Dm', 2]], AC_RIFF: Chord[] = [['Dm', 2], ['A7', 2]];
const AC_ESTRELLA_A: Chord[] = [['C', 4], ['F', 2], ['C', 2], ['F', 2], ['C', 2], ['G', 2], ['C', 2]], AC_ESTRELLA_B: Chord[] = [['C', 2], ['F', 2], ['C', 2], ['G', 2]];
const AC_HIMNO_A: Chord[] = [['C', 4], ['G', 4], ['C', 4], ['G', 4]], AC_HIMNO_A2: Chord[] = [['C', 4], ['G', 4], ['C', 4], ['G', 2], ['C', 2]];
const AC_HIMNO_B: Chord[] = [['G', 2], ['C', 2], ['G', 2], ['C', 2], ['G', 2], ['Am', 2], ['D', 2], ['G', 2]];
const AC_TURCA: Chord[] = [['Am', 2], ['E7', 2], ['Am', 1], ['E', 2], ['Am', 1]];
// ── Repertorio ampliado: obras conocidas de dominio público (clásicas, tradicionales y populares del siglo XIX) ──
// Piano: alturas como suenan. Guitarra: alturas escritas (suena una octava abajo). [altura, tiempos]; null es silencio.
const CUMPLE = [[7, .75], [7, .25], [9, 1], [7, 1], [12, 1], [11, 2], [7, .75], [7, .25], [9, 1], [7, 1], [14, 1], [12, 2], [7, .75], [7, .25],
  [19, 1], [16, 1], [12, 1], [11, 1], [9, 1], [17, .75], [17, .25], [16, 1], [12, 1], [14, 1], [12, 2]];
const AC_CUMPLE: Chord[] = [['C', 1], ['C', 3], ['G7', 3], ['G7', 3], ['C', 3], ['C7', 3], ['F', 3], ['C', 2], ['G7', 1], ['C', 2]];
const CUMPLE_2 = [...CUMPLE, ...CUMPLE.slice(0, -1), [12, 3]], AC_CUMPLE_2: Chord[] = [...AC_CUMPLE, ...AC_CUMPLE.slice(0, -1), ['C', 3]];
const CASCABELES = [[4, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 2], [4, 1], [7, 1], [0, 1.5], [2, .5], [4, 4],
  [5, 1], [5, 1], [5, 1.5], [5, .5], [5, 1], [4, 1], [4, 1], [4, .5], [4, .5], [4, 1], [2, 1], [2, 1], [4, 1], [2, 2], [7, 2],
  [4, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 2], [4, 1], [7, 1], [0, 1.5], [2, .5], [4, 4],
  [5, 1], [5, 1], [5, 1.5], [5, .5], [5, 1], [4, 1], [4, 1], [4, .5], [4, .5], [7, 1], [7, 1], [5, 1], [2, 1], [0, 4]];
const AC_CASCABELES: Chord[] = [['C', 16], ['F', 4], ['C', 4], ['D7', 4], ['G7', 4], ['C', 16], ['F', 4], ['C', 4], ['G7', 4], ['C', 4]];
const CUNA = [[4, .5], [4, .5], [7, 2], [4, .5], [4, .5], [7, 2], [4, .5], [7, .5], [12, 1], [11, 1.5], [9, .5], [9, 1], [7, 1], [2, .5], [4, .5],
  [5, 1], [2, 1], [2, .5], [4, .5], [5, 2], [2, .5], [5, .5], [11, .5], [9, .5], [7, 1], [11, 1], [12, 2], [0, .5], [0, .5],
  [12, 2], [9, .5], [5, .5], [7, 2], [4, .5], [0, .5], [5, 1], [7, 1], [9, 1], [7, 2], [0, .5], [0, .5],
  [12, 2], [9, .5], [5, .5], [7, 2], [4, .5], [0, .5], [5, 1], [4, 1], [2, 1], [0, 2]];
const AC_CUNA: Chord[] = [['C', 1], ['C', 3], ['C', 3], ['C', 1], ['G7', 2], ['G7', 3], ['G7', 3], ['G7', 3], ['G7', 3], ['C', 3], ['F', 3], ['C', 3],
  ['F', 3], ['C', 3], ['F', 3], ['C', 3], ['G7', 3], ['C', 2]];
const NOCHE = [[7, .75], [9, .25], [7, .5], [4, 1.5], [7, .75], [9, .25], [7, .5], [4, 1.5], [14, 1], [14, .5], [11, 1.5], [12, 1], [12, .5], [7, 1.5],
  [9, 1], [9, .5], [12, .75], [11, .25], [9, .5], [7, .75], [9, .25], [7, .5], [4, 1.5], [9, 1], [9, .5], [12, .75], [11, .25], [9, .5], [7, .75], [9, .25], [7, .5], [4, 1.5],
  [14, 1], [14, .5], [17, .75], [14, .25], [11, .5], [12, 1.5], [16, 1.5], [12, .5], [7, .5], [4, .5], [7, .75], [5, .25], [2, .5], [0, 3]];
const AC_NOCHE: Chord[] = [['C', 6], ['G7', 3], ['C', 3], ['F', 3], ['C', 3], ['F', 3], ['C', 3], ['G7', 3], ['C', 3], ['C', 1.5], ['G7', 1.5], ['C', 3]];
// Canon de Pachelbel: tres variaciones de la voz de arriba sobre su progresión de 8 acordes
const CANON_1 = [[18, 2], [16, 2], [14, 2], [13, 2], [11, 2], [9, 2], [11, 2], [13, 2]];
const CANON_2 = [[14, 1], [18, 1], [21, 1], [19, 1], [18, 1], [14, 1], [18, 1], [16, 1], [14, 1], [11, 1], [14, 1], [9, 1], [7, 1], [11, 1], [9, 1], [7, 1]];
const CANON_3 = [14, 16, 18, 14, 13, 14, 16, 13, 11, 13, 14, 11, 9, 11, 13, 9, 7, 9, 11, 7, 6, 7, 9, 6, 7, 9, 11, 7, 9, 11, 13, 16].map(a => [a, .5]);
const AC_CANON: Chord[] = [['D', 2], ['A', 2], ['Bm', 2], ['F#m', 2], ['G', 2], ['D', 2], ['G', 2], ['A', 2]];
const MINUETO_A = [[14, 1], [7, .5], [9, .5], [11, .5], [12, .5], [14, 1], [7, 1], [7, 1], [16, 1], [12, .5], [14, .5], [16, .5], [18, .5], [19, 1], [7, 1], [7, 1],
  [12, 1], [14, .5], [12, .5], [11, .5], [9, .5], [11, 1], [12, .5], [11, .5], [9, .5], [7, .5], [6, 1], [7, .5], [9, .5], [11, .5], [7, .5]];
const MINUETO = [...MINUETO_A, [9, 3], ...MINUETO_A.slice(0, 26), [9, 1], [11, .5], [9, .5], [7, .5], [6, .5], [7, 3]];
const AC_MINUETO: Chord[] = [['G', 6], ['C', 3], ['G', 3], ['Am', 3], ['G', 3], ['D7', 1], ['G', 2], ['D', 3], ['G', 6], ['C', 3], ['G', 3], ['Am', 3], ['G', 3], ['D7', 3], ['G', 3]];
// The Entertainer (Joplin): la frase A termina en Do; la B, en Re (dominante)
const ENT_A = [[2, .25], [3, .25], [4, .25], [12, .5], [4, .25], [12, .5], [4, .25], [12, 1.25], [12, .25], [14, .25], [15, .25], [16, .25],
  [12, .25], [14, .25], [16, .5], [11, .25], [14, .5], [12, 1.75]];
const ENT_B = [[2, .25], [3, .25], [4, .25], [12, .5], [4, .25], [12, .5], [4, .25], [12, 1.25], [9, .25], [7, .25], [6, .25], [9, .25],
  [12, .25], [16, .5], [14, .25], [12, .25], [9, .25], [14, 2]];
const AC_ENT_A: Chord[] = [['C', .5], ['C', 4], ['C', 1], ['G7', .75], ['C', 1.75]], AC_ENT_B: Chord[] = [['C', .5], ['C', 2], ['C', 1], ['D7', 1], ['D7', 2], ['G7', 1.5]];
// Sonata «facile» K 545 (Mozart): el tema y las escalas que bajan por grados
const blanca = (k) => [0, 2, 4, 5, 7, 9, 11][((k % 7) + 7) % 7] + 12 * Math.floor(k / 7); // tecla blanca k desde el Do central
const corrida = (k) => [...[...Array(8)].map((_, j) => [blanca(k + j), .25]), ...[...Array(8)].map((_, j) => [blanca(k + 6 - j), .25])];
const SONATA_A = [[12, 2], [16, 1], [19, 1], [11, 1.5], [12, .25], [14, .25], [12, 2], [21, 2], [19, 1], [24, 1], [19, 1], [17, .5], [16, .25], [17, .25], [16, 2]];
const SONATA_ESCALAS = [5, 4, 3, 2].flatMap(corrida);
const AC_SONATA_A: Chord[] = [['C', 4], ['G7', 2], ['C', 2], ['F', 2], ['C', 2], ['G7', 2], ['C', 2]], AC_SONATA_ESCALAS: Chord[] = [['Am', 4], ['G', 4], ['F', 4], ['C', 4]];
// guitarra
const GRACIA = [[2, 1], [7, 2], [11, .5], [7, .5], [11, 2], [9, 1], [7, 2], [4, 1], [2, 2], [2, 1], [7, 2], [11, .5], [7, .5], [11, 2], [9, 1], [14, 5], [11, 1],
  [14, 2], [11, .5], [7, .5], [11, 2], [9, 1], [7, 2], [4, 1], [2, 2], [2, 1], [7, 2], [11, .5], [7, .5], [11, 2], [9, 1], [7, 5]];
const AC_GRACIA: Chord[] = [['G', 1], ['G', 3], ['G', 3], ['C', 3], ['G', 3], ['G', 3], ['Em', 2], ['D7', 1], ['D', 3], ['D', 2], ['G', 1], ['G', 3], ['G', 3], ['C', 3],
  ['G', 3], ['G', 3], ['G', 2], ['D7', 1], ['G', 5]];
const SUSANA = [[16, 1], [19, 1], [19, 1.5], [21, .5], [19, 1], [16, 1], [12, 1.5], [14, .5], [16, 1], [16, 1], [14, 1], [12, 1], [14, 3], [12, .5], [14, .5],
  [16, 1], [19, 1], [19, 1.5], [21, .5], [19, 1], [16, 1], [12, 1.5], [14, .5], [16, 1], [16, 1], [14, 1], [14, 1]];
const SUSANA_2 = [[12, .5], [14, .5], ...SUSANA, [12, 3], [12, .5], [14, .5], ...SUSANA, [12, 4]];
const AC_SUSANA: Chord[] = [['C', 4], ['C', 4], ['C', 4], ['G', 4], ['C', 4], ['C', 4], ['C', 2], ['G7', 2]], AC_SUSANA_2: Chord[] = [['C', 1], ...AC_SUSANA, ['C', 4], ...AC_SUSANA, ['C', 4]];
const KORO_A = [[16, 1], [11, .5], [12, .5], [14, 1], [12, .5], [11, .5], [9, 1], [9, .5], [12, .5], [16, 1], [14, .5], [12, .5], [11, 1.5], [12, .5], [14, 1], [16, 1], [12, 1], [9, 1], [9, 2],
  [null, .5], [14, 1], [17, .5], [21, 1], [19, .5], [17, .5], [16, 1.5], [12, .5], [16, 1], [14, .5], [12, .5], [11, 1], [11, .5], [12, .5], [14, 1], [16, 1], [12, 1], [9, 1], [9, 2]];
const KORO_B = [[16, 2], [12, 2], [14, 2], [11, 2], [12, 2], [9, 2], [8, 2], [11, 2], [16, 2], [12, 2], [14, 2], [11, 2], [12, 1], [16, 1], [21, 2], [20, 4]];
const AC_KORO_A: Chord[] = [['Am', 4], ['Am', 4], ['E7', 4], ['Am', 4], ['Dm', 4], ['Am', 4], ['E7', 4], ['Am', 4]];
const AC_KORO_B: Chord[] = [['Am', 4], ['E7', 4], ['Am', 4], ['E', 4], ['Am', 4], ['E7', 4], ['Am', 4], ['E', 4]];
const SANTOS = [[null, 1], [12, 1], [16, 1], [17, 1], [19, 4], [null, 1], [12, 1], [16, 1], [17, 1], [19, 4], [null, 1], [12, 1], [16, 1], [17, 1], [19, 2], [16, 2], [12, 2], [16, 2], [14, 4],
  [null, 1], [16, 1], [16, 1], [14, 1], [12, 3], [12, 1], [16, 2], [19, 1], [19, 1], [17, 4], [null, 2], [16, 1], [17, 1], [19, 2], [16, 2], [12, 2], [14, 2], [12, 4]];
const AC_SANTOS: Chord[] = [['C', 28], ['G7', 4], ['C', 4], ['C', 4], ['C', 2], ['C7', 2], ['F', 4], ['C', 4], ['C', 4], ['C', 2], ['G7', 2], ['C', 4]];
// La primavera (Vivaldi): la frase del ritornello; cada vez entra con su Mi de anacrusa
const PRIMAVERA = [[20, .5], [20, .5], [20, .5], [18, .25], [16, .25], [23, 1.5], [23, .25], [21, .25], [20, .5], [20, .5], [20, .5], [18, .25], [16, .25], [23, 1.5], [23, .25], [21, .25],
  [20, .5], [21, .25], [23, .25], [21, .5], [20, .5], [18, 1], [null, .5]];
const PRIMAVERA_2 = [[16, .5], ...PRIMAVERA, [28, .5], ...octava(PRIMAVERA, 1), [16, .5], ...PRIMAVERA, [16, .5], ...PRIMAVERA.slice(0, 16),
  [20, .5], [21, .25], [23, .25], [21, .5], [20, .5], [18, 1], [16, 1]];
const AC_PRIMAVERA_2: Chord[] = [['E', .5], ...rep<Chord>(3, [['E', 4], ['E', 4], ['E', 2], ['B7', 2]]), ['E', 4], ['E', 4], ['E', 2], ['B7', 1], ['E', 1]];
const MOZART40 = [[14, 1], [15, .5], [14, .5], [14, 1], [15, .5], [14, .5], [14, 1], [22, 1], [null, 1], [22, .5], [21, .5], [19, 1], [19, .5], [17, .5], [15, 1], [15, .5], [14, .5],
  [12, 1], [12, 1], [null, 1], [14, .5], [12, .5], [12, 1], [14, .5], [12, .5], [12, 1], [14, .5], [12, .5], [12, 1], [21, 1], [null, 1], [21, .5], [19, .5],
  [18, 1], [18, .5], [16, .5], [14, 1], [14, .5], [12, .5]];
const MOZART40_3 = [[15, .5], [14, .5], ...MOZART40, [10, 1], [10, 1], [null, 1], [27, .5], [26, .5], ...octava(MOZART40, 1), [22, 1], [22, 1], [null, 1], [15, .5], [14, .5],
  ...MOZART40, [10, 1], [9, 1], [7, 2]];
const AC_MOZART40: Chord[] = [['Gm', 8], ['Cm', 8], ['D7', 12], ['Gm', 4]];
const AC_MOZART40_3: Chord[] = [['Gm', 1], ...AC_MOZART40, ...AC_MOZART40, ...AC_MOZART40.slice(0, 3), ['Gm', 1], ['D7', 1], ['Gm', 2]];
// Quinta sinfonía (Beethoven), versión metal: el motivo de cuatro notas, su secuencia y una escala menor armónica
const QUINTA_A = [[null, .5], [7, .5], [7, .5], [7, .5], [3, 3], [null, .5], [5, .5], [5, .5], [5, .5], [2, 3]];
const QUINTA_B = [[null, .5], [7, .5], [7, .5], [7, .5], [3, 2], [null, .5], [8, .5], [8, .5], [8, .5], [7, 2], [null, .5], [15, .5], [15, .5], [15, .5], [12, 2], [null, .5], [7, .5], [7, .5], [7, .5], [2, 2]];
const QUINTA_ESCALA = [0, 2, 3, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 3, 2].map(a => [a, .5]);
const QUINTA = [...QUINTA_A, ...QUINTA_B, ...octava(QUINTA_A, 1), ...QUINTA_B, ...QUINTA_ESCALA, ...octava(QUINTA_ESCALA, 1), [null, .5], [7, .5], [7, .5], [7, .5], [0, 4]];
const AC_QUINTA_A: Chord[] = [['Cm', 5], ['G7', 5]], AC_QUINTA_B: Chord[] = [['Cm', 4], ['Fm', 2], ['G7', 2], ['Cm', 4], ['G7', 4]], AC_QUINTA_ESCALA: Chord[] = [['Cm', 4], ['G7', 4]];
const AC_QUINTA: Chord[] = [...AC_QUINTA_A, ...AC_QUINTA_B, ...AC_QUINTA_A, ...AC_QUINTA_B, ...AC_QUINTA_ESCALA, ...AC_QUINTA_ESCALA, ['Cm', 6]];
// El vuelo del moscardón (Rimsky-Korsakov): bajada cromática de entrada y el tema en semicorcheas (en La menor y luego en Re menor)
const MOSC_INTRO = [28, 27, 26, 25, 26, 25, 24, 23, 24, 23, 22, 21, 20, 19, 18, 17, 16, 17, 16, 15, 16, 17, 16, 15, 16, 17, 16, 15, 16, 17, 16, 15].map(a => [a, .25]);
const MOSC_T = [21, 20, 19, 18, 17, 24, 23, 22, 21, 20, 19, 18, 17, 18, 19, 20].map(a => [a, .25]), MOSC_T2 = MOSC_T.map(([a, d]) => [a + 5, d]);
const MOSCARDON = [...MOSC_INTRO, ...MOSC_T, ...MOSC_T, ...MOSC_T2, ...MOSC_T2, ...MOSC_T, ...MOSC_T, ...octava(MOSC_T, -1), ...octava(MOSC_T, -1), [28, .5], [21, 1.5]];
const AC_MOSC_T: Chord[] = [['Am', 2], ['E7', 2], ['Am', 2], ['E7', 2]], AC_MOSC_T2: Chord[] = [['Dm', 2], ['A7', 2], ['Dm', 2], ['A7', 2]];
const AC_MOSCARDON: Chord[] = [['E7', 8], ...AC_MOSC_T, ...AC_MOSC_T2, ...AC_MOSC_T, ...AC_MOSC_T, ['E7', .5], ['Am', 1.5]];
// batería: patrones de un compás (0 bombo, 1 caja, 2 hi-hat, 4 y 5 toms, 7 platillo); las notas de 2 tiempos o más son redobles
const B_MARCHA = [[0, 1], [2, .5], [2, .5], [1, 1], [2, 1]], B_RELLENO = [[0, 1], [1, .5], [1, .5], [1, .5], [1, .5], [1, 1]], B_REDOBLE = [[0, 1], [1, 1], [1, 2]];
const B_PASO = [[0, 1], [1, 1], [0, 1], [1, .5], [1, .5]];
const B_TREN = [[0, .5], [2, .5], [1, .5], [2, .5], [0, .5], [2, .5], [1, .5], [2, .5]], B_TREN_P = [[7, .5], ...B_TREN.slice(1)];
const B_VALS = [[0, 1], [2, 1], [1, 1]], B_VALS_P = [[7, 1], [2, 1], [1, 1]];
const B_ROCK_P = [[7, .5], ...ROCK.slice(1)], B_TOMS = [[0, .5], [2, .5], [1, .5], [2, .5], [4, .25], [4, .25], [4, .25], [4, .25], [1, .5], [1, .5]];
const B_MEDIO = [[0, 1], [2, 1], [1, 1], [2, 1]], B_MEDIO_P = [[7, 1], [2, 1], [1, 1], [2, 1]], B_CIERRE = [[0, 1], [1, 1], [7, 2]];
const B_SUSANA = [...B_TREN_P, ...B_TREN, ...B_TREN, [0, .5], [2, .5], [1, .5], [2, .5], [7, 2], ...B_TREN_P, ...B_TREN, ...B_TREN];
const B_CUMPLE = [...B_VALS_P, ...B_VALS, ...B_VALS, ...B_VALS, ...B_VALS_P, ...B_VALS, [0, 1], [1, .5], [1, .5], [1, 1]];
const MOZART40_TEMA = [[15, .5], [14, .5], ...rep(2, [...MOZART40, [10, 1], [10, 1], [null, 1], [15, .5], [14, .5]]), ...MOZART40, [10, 1], [9, 1], [7, 2]];
const B_ABEJA = [[0, .25], [2, .25], [1, .25], [2, .25], [0, .25], [0, .25], [1, .25], [2, .25]], B_ABEJA_P = [[7, .25], ...B_ABEJA.slice(1)];
const B_ABEJA_TOMS = [[0, .25], [4, .25], [1, .25], [4, .25], [0, .25], [5, .25], [1, .25], [5, .25]];
const B_QUINTA_A = [[7, .5], [1, .5], [1, .5], [1, .5], [5, 3], [7, .5], [1, .5], [1, .5], [1, .5], [4, 3]];
const B_QUINTA_B = rep(4, [[7, .5], [1, .5], [1, .5], [1, .5], [0, .25], [0, .25], [0, .25], [0, .25], [1, .5], [0, .5]]);
const B_QUINTA_ESCALA = [...rep(8, [[0, .25], [1, .25]]), ...rep(2, [[4, .25], [4, .25], [5, .25], [5, .25]]), [1, .5], [1, .5], [7, 1]];
export const SONGS: Record<Instrument, Song[]> = {
  guitarra: [
    { nombre: 'Romance anónimo', autor: 'Clásica española · tradicional', bpm: 88, nivel: 1, estilo: 'vals',
      notas: [...ROMANCE, ...CIERRE_ROMANCE, ...ROMANCE, [11, 1], [9, 1], [7, 1], ...octava(ROMANCE.slice(0, 12), -1), ...ROMANCE.slice(12), ...CIERRE_ROMANCE],
      acordes: [...AC_ROMANCE, ...AC_CIERRE_ROMANCE, ...AC_ROMANCE, ['Em', 3], ['Em', 12], ...AC_ROMANCE.slice(1), ...AC_CIERRE_ROMANCE] },
    { nombre: 'Greensleeves', autor: 'Folk inglés · tradicional', bpm: 150, nivel: 2, estilo: 'vals',
      notas: [...GREENSLEEVES, [null, 1], ...GREENSLEEVES, [null, 1], ...GREENSLEEVES.slice(19)],
      acordes: [...AC_GREEN_1, ...AC_GREEN_2, ['Am', 1], ...AC_GREEN_1, ...AC_GREEN_2, ['Am', 2], ...AC_GREEN_2] },
    { nombre: 'En la gruta del rey de la montaña', autor: 'Grieg · versión rock', bpm: 132, nivel: 3, estilo: 'rock',
      notas: [...REY_MONTANA, ...REY_MONTANA, ...octava(REY_MONTANA, 1), ...octava(REY_MONTANA, 1), ...REY_MONTANA, [4, .5], [16, .5], [4, .5], [16, .5], [4, 2]],
      acordes: [...rep(5, AC_REY), ['Em', 4]] },
    { nombre: 'Tocata y fuga en re menor', autor: 'Bach · versión metal', bpm: 100, nivel: 4, estilo: 'rock',
      notas: [...TOCATA, ...TOCATA_RIFF, ...TOCATA_RIFF, ...TOCATA, ...TOCATA_RIFF, ...octava(TOCATA_RIFF, 1), ...TOCATA_RIFF, ...octava(TOCATA_RIFF, 1),
        ...TOCATA, ...TOCATA_RIFF, ...TOCATA_RIFF, [2, .25], [5, .25], [9, .25], [14, .25], [21, 1], [14, 2]],
      acordes: [...AC_TOCATA, ...rep(2, AC_RIFF), ...AC_TOCATA, ...rep(4, AC_RIFF), ...AC_TOCATA, ...rep(2, AC_RIFF), ['Dm', 4]] },
    { nombre: 'Amazing Grace', autor: 'Himno tradicional · vals', bpm: 104, nivel: 1, estilo: 'vals', notas: [...octava(GRACIA, 1), ...octava(GRACIA, 1)], acordes: rep(2, AC_GRACIA) },
    { nombre: 'Oh! Susanna', autor: 'Stephen Foster · country', bpm: 120, nivel: 1, estilo: 'rock', notas: SUSANA_2, acordes: AC_SUSANA_2 },
    { nombre: 'Korobéiniki', autor: 'Canción popular rusa · rock', bpm: 132, nivel: 2, estilo: 'rock',
      notas: [...KORO_A, ...KORO_B, ...octava(KORO_A, 1)], acordes: [...AC_KORO_A, ...AC_KORO_B, ...AC_KORO_A] },
    { nombre: 'La marcha de los santos', autor: 'Espiritual tradicional · dixieland', bpm: 160, nivel: 2, estilo: 'rock', notas: [...SANTOS, ...octava(SANTOS, 1)], acordes: rep(2, AC_SANTOS) },
    { nombre: 'La primavera', autor: 'Vivaldi · Las cuatro estaciones', bpm: 100, nivel: 3, estilo: 'arpegio', notas: PRIMAVERA_2, acordes: AC_PRIMAVERA_2 },
    { nombre: 'Sinfonía n.º 40', autor: 'Mozart · versión rock', bpm: 144, nivel: 3, estilo: 'rock', notas: MOZART40_3, acordes: AC_MOZART40_3 },
    { nombre: 'Quinta sinfonía', autor: 'Beethoven · versión metal', bpm: 160, nivel: 4, estilo: 'rock', notas: QUINTA, acordes: AC_QUINTA },
    { nombre: 'El vuelo del moscardón', autor: 'Rimsky-Kórsakov · versión metal', bpm: 80, nivel: 4, estilo: 'rock', notas: MOSCARDON, acordes: AC_MOSCARDON },
  ],
  piano: [
    { nombre: 'Estrellita', autor: 'Tradicional', bpm: 96, nivel: 1, estilo: 'arpegio',
      notas: [...ESTRELLA_A, ...ESTRELLA_B, ...ESTRELLA_B, ...ESTRELLA_A, ...octava(ESTRELLA_A, 1), ...octava(ESTRELLA_B, 1), ...octava(ESTRELLA_B, 1), ...ESTRELLA_A],
      acordes: rep(2, [...AC_ESTRELLA_A, ...AC_ESTRELLA_B, ...AC_ESTRELLA_B, ...AC_ESTRELLA_A]) },
    { nombre: 'Himno de la alegría', autor: 'Beethoven', bpm: 108, nivel: 2, estilo: 'rasgueo',
      notas: [...HIMNO_A, ...HIMNO_A2, ...HIMNO_B, ...HIMNO_A2, ...HIMNO_B, ...octava(HIMNO_A2, 1)],
      acordes: [...AC_HIMNO_A, ...AC_HIMNO_A2, ...AC_HIMNO_B, ...AC_HIMNO_A2, ...AC_HIMNO_B, ...AC_HIMNO_A2] },
    { nombre: 'Para Elisa', autor: 'Beethoven', bpm: 66, nivel: 3, estilo: 'arpegio',
      // anacrusa (Mi–Re♯) + A con el primer final + A con el segundo final + B + A y el La final
      notas: [[16, .25], [15, .25], ...ELISA_A, ...ELISA_FIN_1, ...ELISA_A, ...ELISA_FIN_2, ...ELISA_B, ...ELISA_A, [9, 1.5]],
      acordes: [['E', .5], ...AC_ELISA_A, ['Am', 1.5], ...AC_ELISA_A, ['Am', 1.5], ...AC_ELISA_B, ...AC_ELISA_A, ['Am', 1.5]] },
    { nombre: 'Marcha turca', autor: 'Mozart', bpm: 88, nivel: 4, estilo: 'rasgueo',
      notas: [...TURCA, ...TURCA, ...octava(TURCA, -1), ...octava(TURCA, -1), ...TURCA, [9, .5], [12, .5], [16, .5], [21, 2]],
      acordes: [...rep(5, AC_TURCA), ['Am', 3.5]] },
    { nombre: 'Cumpleaños feliz', autor: 'Mildred y Patty Hill · tradicional', bpm: 100, nivel: 1, estilo: 'vals', notas: CUMPLE_2, acordes: AC_CUMPLE_2 },
    { nombre: 'Cascabeles', autor: 'James Pierpont · navideña', bpm: 132, nivel: 1, estilo: 'rasgueo', notas: [...octava(CASCABELES, 1), ...CASCABELES], acordes: rep(2, AC_CASCABELES) },
    { nombre: 'Canción de cuna', autor: 'Brahms', bpm: 100, nivel: 2, estilo: 'vals', notas: [...CUNA, ...octava(CUNA, 1).slice(0, -1), [12, 3]], acordes: [...AC_CUNA, ...AC_CUNA.slice(0, -1), ['C', 3]] },
    { nombre: 'Noche de paz', autor: 'Franz Gruber · navideña', bpm: 108, nivel: 2, estilo: 'arpegio', notas: [...NOCHE, ...octava(NOCHE, 1)], acordes: rep(2, AC_NOCHE) },
    { nombre: 'Canon en re', autor: 'Pachelbel', bpm: 84, nivel: 3, estilo: 'arpegio', notas: [...CANON_1, ...CANON_2, ...CANON_3, ...CANON_2, [14, 4]], acordes: [...rep(4, AC_CANON), ['D', 4]] },
    { nombre: 'Minueto en sol', autor: 'Petzold · Cuaderno de Anna Magdalena Bach', bpm: 126, nivel: 3, estilo: 'vals', notas: [...MINUETO, ...octava(MINUETO, 1)], acordes: rep(2, AC_MINUETO) },
    { nombre: 'The Entertainer', autor: 'Scott Joplin · ragtime', bpm: 92, nivel: 4, estilo: 'rasgueo',
      notas: octava([...ENT_A, ...ENT_B, ...ENT_A, ...ENT_B, ...ENT_A, ...ENT_A], 1), acordes: [...AC_ENT_A, ...AC_ENT_B, ...AC_ENT_A, ...AC_ENT_B, ...AC_ENT_A, ...AC_ENT_A] },
    { nombre: 'Sonata facile', autor: 'Mozart · K 545', bpm: 100, nivel: 4, estilo: 'arpegio', notas: [...SONATA_A, ...SONATA_ESCALAS, ...SONATA_A, ...SONATA_ESCALAS, [19, .5], [17, .5], [14, .5], [11, .5], [12, 2]],
      acordes: [...AC_SONATA_A, ...AC_SONATA_ESCALAS, ...AC_SONATA_A, ...AC_SONATA_ESCALAS, ['G7', 2], ['C', 2]] },
  ],
  bateria: [
    { nombre: 'Marcha', autor: 'Original · bombo, caja y hi-hat', bpm: 90, nivel: 1, estilo: 'bloque', acordes: [['C', 4], ['G', 4], ['Am', 4], ['F', 4]],
      notas: [...rep(3, MARCHA), ...MARCHA_FILL, ...rep(3, MARCHA), ...MARCHA_FILL, ...rep(3, MARCHA), [0, 1], [1, 1], [0, 1], [1, 3]] },
    { nombre: 'Rock en la tarima', autor: 'Original · con platillo', bpm: 100, nivel: 2, estilo: 'rock', acordes: [['A', 4], ['G', 4], ['D', 4], ['A', 4]],
      notas: [[7, 1], ...rep(4, ROCK), [1, 2], [7, 1], ...rep(4, ROCK), [1, 2], [7, 1], ...rep(2, ROCK), [1, 2], [7, 2]] },
    { nombre: 'Funk de neón', autor: 'Original · con tom', bpm: 100, nivel: 3, estilo: 'bloque', acordes: [['Em7', 4], ['A7', 4]],
      notas: [...rep(4, FUNK), [4, 2], [7, 1], ...rep(4, FUNK), [4, .25], [4, .25], [1, .25], [1, .25], [1, 2], [7, 1], ...rep(2, FUNK), [7, 2]] },
    { nombre: 'Redoble final', autor: 'Original · dos toms', bpm: 104, nivel: 4, estilo: 'rock', acordes: [['Dm', 4], ['Bb', 4], ['C', 4], ['Dm', 4]],
      notas: [...rep(3, [...ROCK, ...REDOBLE]), [1, 2], [7, 1], ...rep(2, [...ROCK, ...ROCK, ...REDOBLE]), [5, 2], ...rep(2, REDOBLE), [0, .25], [4, .25], [5, .25], [1, .25], [0, .25], [4, .25], [5, .25], [1, .25], [7, 2]] },
    { nombre: 'Cascabeles', autor: 'James Pierpont · con melodía', bpm: 126, nivel: 1, estilo: 'rasgueo', tema: octava(CASCABELES, 1), acordes: AC_CASCABELES,
      notas: [...rep(3, B_MARCHA), ...B_RELLENO, ...rep(3, B_MARCHA), ...B_REDOBLE, ...rep(3, B_MARCHA), ...B_RELLENO, ...rep(3, B_MARCHA), ...B_REDOBLE] },
    { nombre: 'La marcha de los santos', autor: 'Espiritual tradicional · con melodía', bpm: 132, nivel: 1, estilo: 'banda', tema: SANTOS, acordes: AC_SANTOS,
      notas: [[2, 1], [2, 1], [1, .5], [1, .5], [1, 1], ...rep(6, B_PASO), [1, 4], ...rep(3, B_PASO), ...B_REDOBLE, ...rep(3, B_PASO), [0, 1], [2, 1], [1, 2]] },
    { nombre: 'Oh! Susanna', autor: 'Stephen Foster · con melodía', bpm: 120, nivel: 2, estilo: 'banda', tema: SUSANA_2, acordes: AC_SUSANA_2,
      notas: [[2, .5], [2, .5], ...B_SUSANA, [0, .5], [1, .5], [0, .5], [1, .5], [1, 2], ...B_SUSANA, ...B_CIERRE] },
    { nombre: 'Cumpleaños feliz', autor: 'Mildred y Patty Hill · vals con melodía', bpm: 104, nivel: 2, estilo: 'vals', tema: CUMPLE_2, acordes: AC_CUMPLE_2,
      notas: [[2, 1], ...B_CUMPLE, [0, 1], [1, 2], ...B_CUMPLE, [0, 1], [7, 2]] },
    { nombre: 'Korobéiniki', autor: 'Canción popular rusa · rock con melodía', bpm: 140, nivel: 3, estilo: 'banda', tema: [...KORO_A, ...KORO_B, ...KORO_A],
      acordes: [...AC_KORO_A, ...AC_KORO_B, ...AC_KORO_A],
      notas: [...B_ROCK_P, ...rep(6, ROCK), ...B_TOMS, ...B_MEDIO_P, ...rep(6, B_MEDIO), [4, 2], [1, 2], ...B_ROCK_P, ...rep(6, ROCK), ...B_CIERRE] },
    { nombre: 'Sinfonía n.º 40', autor: 'Mozart · rock con melodía', bpm: 144, nivel: 3, estilo: 'banda', tema: MOZART40_TEMA, acordes: AC_MOZART40_3,
      notas: [[1, .5], [1, .5], ...rep(2, [...B_ROCK_P, ...rep(6, ROCK), [0, .5], [2, .5], [1, .5], [2, .5], [4, 2]]), ...B_ROCK_P, ...rep(6, ROCK), ...B_CIERRE] },
    { nombre: 'Quinta sinfonía', autor: 'Beethoven · metal con melodía', bpm: 160, nivel: 4, estilo: 'banda', tema: QUINTA, acordes: AC_QUINTA,
      notas: [...B_QUINTA_A, ...B_QUINTA_B, ...B_QUINTA_A, ...B_QUINTA_B, ...B_QUINTA_ESCALA, ...B_QUINTA_ESCALA, [1, .5], [1, .5], [1, .5], [1, .5], [7, 4]] },
    { nombre: 'El vuelo del moscardón', autor: 'Rimsky-Kórsakov · con melodía', bpm: 80, nivel: 4, estilo: 'banda', tema: octava(MOSCARDON, -1), acordes: AC_MOSCARDON,
      notas: [[7, .5], [4, .25], [4, .25], [5, .25], [5, .25], [1, .25], [1, .25], [4, .25], [4, .25], [4, .25], [4, .25], [5, .25], [5, .25], [5, .25], [5, .25],
        [1, 2], [0, .5], [1, .5], [0, .5], [1, .5], ...B_ABEJA_P, ...rep(3, B_ABEJA), ...rep(3, B_ABEJA_TOMS), [5, 2], ...B_ABEJA_P, ...rep(3, B_ABEJA),
        ...B_ABEJA_P, ...rep(2, B_ABEJA), [4, 2], [0, .5], [7, 1.5]] },
  ],
};
// carriles de una canción: la batería usa sus piezas; guitarra y piano reparten las alturas de la melodía de grave a agudo
export function lanesFor(def: Song, instrumento: Instrument): { carriles: Lane[]; carrilDe: (v: number) => number } {
  const n = LEVELS[def.nivel].carriles, colores = LANE_COLORS[n].map(k => NOTE_COLORS[k]);
  if (instrumento === 'bateria') {
    const piezas = LEVEL_DRUMS[n];
    return { carriles: piezas.map((p, i) => ({ s: p, nombre: DRUM_PIECES[p], tecla: String(i + 1), color: colores[i] })), carrilDe: (v) => piezas.indexOf(v) };
  }
  const altos = [...new Set(def.notas.map(x => x[0]).filter(v => v !== null))].sort((a, b) => a - b), k = altos.length;
  const deRango = (r) => (k <= n ? Math.round(r * (n - 1) / Math.max(1, k - 1)) : Math.min(n - 1, Math.floor(r * n / k)));
  const base = Array(n).fill(null); altos.forEach((a, r) => { const c = deRango(r); if (base[c] === null) base[c] = a; });
  for (let c = 0; c < n; c++) if (base[c] === null) base[c] = (base[c - 1] ?? altos[0]) + 2;
  return { carriles: base.map((a, i) => ({ s: a, nombre: CHROMATIC_NAMES[((a % 12) + 12) % 12], tecla: String(i + 1), color: colores[i] })), carrilDe: (v) => deRango(altos.indexOf(v)) };
}
