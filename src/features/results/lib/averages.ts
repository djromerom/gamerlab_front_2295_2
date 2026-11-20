// Promedios públicos: con el ranking oculto el backend devuelve el promedio en null.
export const AVERAGES_HIDDEN_MESSAGE = "Disponible cuando se publique el ranking";

/** Texto del promedio, o null si no hay un número finito que mostrar. */
export function formatAverage(value: number | null | undefined, digits = 2): string | null {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : null;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export interface MateriaAverage {
  name: string;
  value: number | null;
  color?: string;
}
interface NrcAverage {
  codigo: number;
  promedioxNRC?: number | null;
}
interface VideojuegoRef {
  materia?: string;
  nrc?: string | number;
}

export interface AverageChartData {
  /** Materias con promedio numérico (para el gráfico). */
  materias: { name: string; value: number; color?: string }[];
  /**
   * ARK-265 (BG-65): todas las materias de la tabla «Promedios por Materia». Las que no tienen
   * ninguna nota traen `value: null` y la tabla dice «Sin nota» en vez de ocultarlas o mostrar 0.00.
   * Vacía si los promedios están ocultos (ranking sin publicar).
   */
  materiasTabla: { name: string; value: number | null; color?: string }[];
  /** Filas del gráfico de barras, ordenadas de mayor a menor. */
  chart: { name: string; promedio: number }[];
  /** true si hay filas y TODOS sus promedios vienen null (ranking oculto). */
  hidden: boolean;
  /** true si las materias llegan todas en null (para la tabla por materia). */
  materiasHidden: boolean;
}

export function buildAverageChartData(args: {
  materias: MateriaAverage[];
  filtroMateria: string;
  videojuegos: VideojuegoRef[];
  nrcs: NrcAverage[];
}): AverageChartData {
  const rows = args.materias.filter((m) => m && typeof m.name === "string");
  const materias = rows.filter((m): m is MateriaAverage & { value: number } => isNum(m.value));
  const materiasHidden = rows.length > 0 && rows.every((m) => m.value === null);

  if (args.filtroMateria === "Todas") {
    const chart = materias
      .map((m) => ({ name: m.name, promedio: m.value }))
      .sort((a, b) => b.promedio - a.promedio);
    return {
      materias,
      materiasTabla: materiasHidden ? [] : rows,
      chart,
      hidden: materiasHidden,
      materiasHidden,
    };
  }

  const refs = args.videojuegos
    .filter((vj) => vj.materia === args.filtroMateria)
    .map((vj) => args.nrcs.find((n) => n.codigo.toString() === String(vj.nrc)));
  const hidden = refs.length > 0 && refs.every((n) => n?.promedioxNRC === null);
  const chart = args.videojuegos
    .filter((vj) => vj.materia === args.filtroMateria)
    .map((vj, i) => ({ nrc: refs[i], vj }))
    .filter(({ nrc }) => nrc?.promedioxNRC !== null)
    .map(({ nrc }) => ({
      name: nrc?.codigo.toString() || "N/A",
      promedio: isNum(nrc?.promedioxNRC) ? nrc.promedioxNRC : 0,
    }))
    .sort((a, b) => b.promedio - a.promedio);
  return {
    materias: hidden ? [] : materias,
    materiasTabla: hidden || materiasHidden ? [] : rows,
    chart,
    hidden,
    materiasHidden,
  };
}

/** true si hay videojuegos y ninguno trae `promedio` (el backend lo omite con el ranking oculto). */
export function isRankingHidden(games: { promedio?: number | null }[]): boolean {
  return games.length > 0 && games.every((g) => g.promedio == null);
}

/** Promedio general (2 decimales) de los videojuegos con promedio numérico, o null si no hay. */
export function averageOfGames(games: { promedio?: number | null }[]): string | null {
  const nums = games.map((g) => g.promedio).filter(isNum);
  return nums.length ? formatAverage(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}
