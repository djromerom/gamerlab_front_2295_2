// Interfaces basadas en la estructura real de la base de datos
export interface TeamRowData {
  id_equipo: number;
  nombre_equipo: string;
  fecha_registro: string;
  id_usuario: string;
  id_edicion: number;
  activo: boolean;
  id_estado_confirmacion: number; // Estado del equipo, 1:confirmado, 2:pendiente, 3:expirado
  estado_nombre: string; // Desde estados_confirmacion
  // Campos opcionales para compatibilidad con el nuevo backend
  isExternal?: boolean;
  team_nrc_global_id?: number | string;
  integrantes: IntegranteData[];
  videojuego: VideojuegoData;
  nrc_info?: NrcInfo; // Información del NRC si aplica
  materia_info?: MateriaInfo; // Información de la materia si aplica
}

export interface ConfirmationStatus {
  id: number;
  status: string; // e.g. "PENDIENTE", "CONFIRMADO", "EXPIRADO"
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  isActive: boolean;
}

export interface TeamConfirmationStatusResponse {
  confirmationStatus: ConfirmationStatus;
}


export interface IntegranteData {
  id_integrante: number;
  nombre: string;
  apellido: string;
  correo: string;
  codigo_estudiantil: string;
  id_equipo: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  // Nuevo: algunos endpoints traen los NRCs anidados dentro del integrante
  nrcs?: any[]; // formato variable (se mapea en el cliente a NrcInfo cuando se requiere)
}

export interface VideojuegoData {
  id_videojuego: number;
  nombre: string;
  descripcion: string;
  logo_url: string;
  fecha_registro: string;
  id_estado_videojuego: number; // estado del videojuego -> 1:Confirmado, 2:pendiente, 3:rechazado
  id_equipo: number;
  activo: boolean;
  // Campos opcionales recibidos por el nuevo backend
  video_demo_url?: string;
  repo_url?: string;
}

export interface NrcInfo {
  id_nrc: number;
  codigo: number;
  id_materia: number;
  id_profesor: string;
}

export interface MateriaInfo {
  id_materia: number;
  nombre: string;
  codigo: string;
  semestre: number;
}

export interface EstadoConfirmacion {
  id_estado: number;
  estado: string;
  activo: boolean;
}

export interface EstadoVideojuego {
  id_estado: number;
  estado: string;
  activo: boolean;
}

export interface ProfesorData {
  id_profesor: string;
  firstName: string;
  lastName: string;
  correo: string;
  activo: boolean;
}

export interface TeamFormData {
  nombre_equipo: string;
  id_usuario: string;
  id_edicion: number;
  id_estado_confirmacion: number;
  integrantes: {
    nombre: string;
    apellido: string;
    correo: string;
    codigo_estudiantil: string;
  }[];
  videojuego: {
    nombre: string;
    descripcion: string;
    logo_url?: string;
  };
  nrc_info?: {
    id_nrc: number;
  };
}

export interface PaginatedTeams {
  data: TeamRowData[];
  metadata: {
    totalItems: number;
    itemsOnCurrentPage: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
}

export interface Props {
  teams: TeamRowData[] | null;
  paginationMeta: PaginationMetadata;
  apiBaseUrl: string;
  isDataLoading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  refreshData: () => void;
  statusEmailLeader?: (email: string) => TeamConfirmationStatusResponse | null;
}

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
