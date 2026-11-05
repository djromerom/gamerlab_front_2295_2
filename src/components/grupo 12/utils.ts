import type { JurorCategory, JurorType } from "@/types/jurados";

export const mapConfirmationStatus = (statusId: number): string => {
  switch (statusId) {
    case 1: return "Confirmado";
    case 2: return "Pendiente";
    default: return "Expirado";
  }
};

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "Nunca";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Nunca";
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export interface JurorRowData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmationStatusId: number | string; // Puede ser string si ya fue mapeado
  lastSignInAt: string | null;
  jurorCategory?: JurorCategory | null;
  jurorType?: JurorType | null;
  /** Lo envía el back (ARK-139): un profesor siempre es Senior. */
  isProfessor?: boolean;
  evaluatedCount: number;
  evaluatedGameNames: string[];
  unevaluatedCount: number;
  unevaluatedGameNames: string[];
}

export interface JurorFormData {
  firstName: string;
  lastName: string;
  email: string;
  jurorCategory: JurorCategory;
  jurorType: JurorType;
}

// Junior y Oficial por defecto: Senior es solo para profesores que participan como jurados.
export const DEFAULT_JUROR_CATEGORY: JurorCategory = "JUNIOR";
export const DEFAULT_JUROR_TYPE: JurorType = "OFFICIAL";

// Un profesor siempre es Senior (ARK-139); un jurado sin categoría se propone como Junior.
export const editableJurorCategory = (juror: Pick<JurorRowData, "jurorCategory" | "isProfessor">): JurorCategory =>
  juror.isProfessor ? "SENIOR" : (juror.jurorCategory ?? DEFAULT_JUROR_CATEGORY);

export const EMPTY_JUROR_FORM: JurorFormData = {
  firstName: "",
  lastName: "",
  email: "",
  jurorCategory: DEFAULT_JUROR_CATEGORY,
  jurorType: DEFAULT_JUROR_TYPE,
};

// El ValidationPipe del backend devuelve `message` como string o como lista de strings.
export const getApiErrorMessage = (body: unknown, fallback: string): string => {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) {
    const parts = message.filter((m): m is string => typeof m === "string" && m.trim() !== "");
    return parts.length > 0 ? parts.join(". ") : fallback;
  }
  return typeof message === "string" && message.trim() !== "" ? message : fallback;
};

export interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export interface PaginatedJurors {
  data: JurorRowData[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export interface Props {
  jurors: JurorRowData[] | null; // Solo datos de la página actual
  paginationMeta: PaginationMetadata; // Metadatos de paginación
  apiBaseUrl: string;
  isDataLoading?: boolean; // Estado de carga del padre
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  refreshData: () => void; // Simplificado
}