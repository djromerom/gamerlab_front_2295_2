export interface TeamRowData {
  id_equipo: number;
  nombre_equipo: string;
  fecha_registro: string;
  id_usuario: string;
  id_edicion: number;
  activo: boolean;
  isExternal?: boolean;
  teamCode?: string;
  team_nrc_global_id?: number | string;
  integrantes: IntegranteData[];
  videojuego: VideojuegoData;
  nrc_info?: NrcInfo; 
  materia_info?: MateriaInfo;
  teamCode?: string;
}

export interface ConfirmationStatus {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string; 
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
  nrcs?: any[];
}

export interface VideojuegoData {
  id_videojuego: number;
  nombre: string;
  descripcion: string;
  logo_url: string;
  fecha_registro: string;
  id_estado_videojuego: number; 
  additionalImages?: any[];
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
    video_demo_url?: string;
    repo_url?: string;
    additionalImages?: { url: string }[];
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

export interface NrcOption {
  code: number | string;
  name?: string;
  [key: string]: unknown;
}

export type SafeNrc = {
  id: number;
  codeStr: string;
  label: string;
};

export type UploadInfo = {
  blobName?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  isPublic?: boolean;
  url: string;
};