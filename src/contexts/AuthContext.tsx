import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useRef,
} from "react";
import {
  LoginCredentials,
  AuthContextType,
  Role,
  UserProfile,
} from "@/types/auth";
import { apiFetch, SessionRejectedError } from "@/lib/api";
import {
  getRefreshDelayMs,
  REFRESH_RETRY_DELAY_MS,
  SESSION_EXPIRED_EVENT,
} from "@/lib/session";
import { resetOwnTeamCacheForTests } from "@/lib/ownTeam";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  // Cierre de sesión voluntario (botón "Salir"): a diferencia de la sesión vencida,
  // no se guarda la ruta de origen para volver a ella (BG-08)
  const [signedOut, setSignedOut] = useState<boolean>(false);

  // [MODIFICACIÓN]: Temporizador de renovación programado según accessTokenExpiresIn (HU-05)
  // [ANTES]: setInterval fijo de 14 min, con solo 1 min de margen sobre el token de 15 min
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRefreshAtRef = useRef<number | null>(null);
  // Indica si hay una sesión activa, para distinguir una expiración de la carga inicial sin sesión
  const hasSessionRef = useRef(false);
  const ownTeamUserRef = useRef<string | null>(null);

  function stopHeartbeat() {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    nextRefreshAtRef.current = null;
  }

  function scheduleRefresh(delayMs: number) {
    stopHeartbeat();
    nextRefreshAtRef.current = Date.now() + delayMs;
    refreshTimeoutRef.current = setTimeout(runScheduledRefresh, delayMs);
  }

  function runScheduledRefresh() {
    stopHeartbeat();
    contextRefreshAccessToken().catch(() => {
      // Si la sesión sigue activa fue un fallo de red o del servidor: se reintenta
      if (hasSessionRef.current) {
        console.warn("Heartbeat: Falló la renovación. Reintentando...");
        scheduleRefresh(REFRESH_RETRY_DELAY_MS);
      }
    });
  }

  // Cierra la sesión local. Si había sesión, se marca como expirada para avisar al usuario.
  function endSession() {
    stopHeartbeat();
    if (hasSessionRef.current) {
      setSessionExpired(true);
    }
    hasSessionRef.current = false;
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  }

  const fetchProfile = async (): Promise<boolean> => {
    let ok = false;
    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/me`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (res.ok) {
        const data = (await res.json()) as UserProfile;
        setUser(data);
        ok = true;
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch profile:", error);
      setUser(null);
      setAccessToken(null);
    }
    setLoading(false);
    return ok;
  };

  const contextRefreshAccessToken = async (): Promise<string | null> => {
    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (res.status === 401 || res.status === 403) {
        throw new SessionRejectedError(
          `Refresh API request failed with status ${res.status}`,
        );
      }
      if (!res.ok) {
        throw new Error(`Refresh API request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (!data.accessToken || typeof data.accessToken !== "string") {
        throw new SessionRejectedError(
          "Access token not found or invalid in refresh response",
        );
      }

      setAccessToken(data.accessToken);
      // El perfil solo se pide al iniciar la sesión, no en cada renovación
      const hasProfile = hasSessionRef.current || (await fetchProfile());
      if (hasProfile) {
        hasSessionRef.current = true;
        setSessionExpired(false);
        setSignedOut(false);
        scheduleRefresh(getRefreshDelayMs(data.accessTokenExpiresIn));
      }
      return data.accessToken;
    } catch (error) {
      if (error instanceof Error && error.message.includes("status 401")) {
        // No imprimimos error en rojo porque es normal (ej. primera carga sin estar logueado)
      } else {
        console.error("AuthContext: Failed to refresh access token:", error);
      }
      // [MODIFICADO]: Un fallo de red o del servidor no cierra una sesión activa; el heartbeat reintenta
      // [ANTES]: Cualquier fallo cerraba la sesión
      if (error instanceof SessionRejectedError || !hasSessionRef.current) {
        endSession();
      }
      throw error;
    }
  };

  // login no activa el `loading` global: RoutesConfiguration lo usa para reemplazar todo
  // el árbol por una pantalla de carga, lo que desmontaba LoginPage y borraba el correo y el error.
  // El estado de envío vive en LoginPage (isSubmitting).
  const login = async ({ email, password }: LoginCredentials) => {
    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const log = await res.json();

      if (!res.ok) {
        throw new Error(log.message || "Invalid credentials");
      }
      await contextRefreshAccessToken();
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          (error.message.includes("Refresh API request failed") ||
            error.message.includes("Access token not found"))
        )
      ) {
        setUser(null);
        setAccessToken(null);
      }
      throw error;
    }
  };

  const logout = async () => {
    // [MODIFICADO]: Se detiene explícitamente el temporizador de refresco antes de limpiar la sesión
    // [ANTES]: No se detenía el intervalo, por lo que la sesión podía revivir
    stopHeartbeat();
    resetOwnTeamCacheForTests();
    hasSessionRef.current = false;
    setSessionExpired(false);

    try {
      await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("AuthContext: Logout API call failed:", error);
    }
    // Se marca junto con setUser(null) para que ProtectedRoute lo vea en el mismo render
    setSignedOut(true);
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  useEffect(() => {
    const userId = user?.id ?? null;
    if (ownTeamUserRef.current !== userId) {
      resetOwnTeamCacheForTests();
      ownTeamUserRef.current = userId;
    }
  }, [user?.id]);

  useEffect(() => {
    // 1. Ejecución inmediata al cargar la app para intentar recuperar la sesión
    const initSession = async () => {
      await contextRefreshAccessToken().catch(() => {
        // Silencioso, no pasa nada si no hay sesión inicial
      });
    };

    initSession();

    // 2. Los navegadores retrasan los temporizadores en pestañas ocultas o con el equipo suspendido:
    // al volver a la pestaña se renueva de inmediato si la renovación quedó atrasada.
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        nextRefreshAtRef.current !== null &&
        Date.now() >= nextRefreshAtRef.current
      ) {
        runScheduledRefresh();
      }
    };

    // 3. apiFetch avisa cuando el backend rechaza el refresh token en una petición cualquiera
    const handleSessionExpired = () => {
      if (hasSessionRef.current) {
        endSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    // Limpieza: Al desmontar el componente (ej. cerrar app), detenemos el reloj
    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const userRole: Role | null = user?.role.name ?? null;

  const value = useMemo(
    () => ({
      accessToken: accessToken,
      user,
      userRole,
      loading,
      sessionExpired,
      signedOut,
      login,
      refreshAccessToken: contextRefreshAccessToken,
      logout,
    }),
    [user, userRole, loading, sessionExpired, signedOut, accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
