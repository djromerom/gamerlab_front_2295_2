export const mapConfirmationStatus = (statusId: number): string => {
  switch (statusId) {
    case 1: return "Confirmado";
    case 2: return "Pendiente";
    default: return "Expirado";
  }
};

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export interface Jurado {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmationStatusId: number | string; // Puede ser string si ya fue mapeado
  lastSignInAt: string;
  evaluatedCount: number;
  evaluatedGameNames: string[];
  unevaluatedCount: number;
  unevaluatedGameNames: string[];
}

export interface Props {
  data:       Data;   // filas de la página ACTUAL
  totalRows:  number;     // registros en BD
  totalPages: number;     // total de páginas
  page:       number;     // página (1-based)
  limit:      number;     // tamaño de página
  isLoading?: boolean;
  setIsLoading: (loading: boolean) => void;
  onPageChange:  (n: number) => void;
  onLimitChange: (n: number) => void;
  apiBaseUrl: string;
  onRefresh: () => void;
}

export interface Data {
  titulo: string;
  nombreTabla: string;
  nombreColumnas: NombreColumnas;
  filas: Jurado[];
  primaryKey: keyof Jurado;
}

export interface NombreColumnas {
  [key: string]: string;
}

export interface RowData extends Record<string, any> {
  id: number | string;
}
