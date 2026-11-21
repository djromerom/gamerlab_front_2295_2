/** HU-53 (ARK-325): datos y textos de las rúbricas en solo lectura (jurados y profesores). */

export interface Rubric {
  id: number;
  name: string;
  description?: string | null;
  weight?: number | null;
  isActive: boolean;
}

export const RUBRICS_EMPTY_MESSAGE = "Aún no hay rúbricas publicadas";
export const RUBRICS_ERROR_MESSAGE = "No pudimos cargar las rúbricas.";

// Los criterios activos son pocos; el back acepta hasta 100 por página.
export const RUBRICS_LIMIT = 100;
