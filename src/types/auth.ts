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
  login: (credentials: LoginCredentials) => Promise<string>;
  refreshAccessToken: () => Promise<string>;
  logout: () => void;
}
export interface UserProfile {
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
