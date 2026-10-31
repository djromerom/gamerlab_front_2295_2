export type Role =
  | "Profesor"
  | "Administrador"
  | "Jurado"
  | "Estudiante"
  | "Consultor";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  loading: Boolean;
  accessToken: string | null;
  userRole: Role | null;
  user: UserProfile | null;
  /** La sesión se cerró porque el refresh token venció o es inválido */
  sessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}
export interface UserProfile {
  /** Clave opaca (16 hex) para reconocer eventos de likes propios */
  likeKey?: string;
  /** UUID único del usuario */
  id: string;
  /** Primer nombre */
  firstName: string;
  /** Apellidos */
  lastName: string;
  /** Correo electrónico */
  email: string;
  /** Indica si la cuenta está activa */
  isActive: boolean;
  /** Fecha de creación en formato ISO */
  createdAt: string;
  /** Fecha de última actualización en formato ISO */
  updatedAt: string;
  /** Rol del usuario */
  role: {
    /** Nombre del rol, coincide con el tipo Role */
    name: Role;
    /** Descripción legible del rol */
    description: string;
  };
  /** Estado de confirmación de la cuenta */
  confirmationStatus: {
    /** Por ejemplo "CONFIRMADO", "PENDIENTE", etc. */
    status: string;
  };
}
