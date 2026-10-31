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
  evaluatedCount: number;
  evaluatedGameNames: string[];
  unevaluatedCount: number;
  unevaluatedGameNames: string[];
}

export interface JurorFormData {
  firstName: string;
  lastName: string;
  email: string;
}

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