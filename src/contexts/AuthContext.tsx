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
import { apiFetch } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // [MODIFICACIÓN]: Referencia para mantener el control del temporizador de refresco y poder detenerlo al cerrar sesión
  // [AUTOR]: IA  |  [FECHA]: 2026-05-02
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  function stopHeartbeat() {
    if (refreshIntervalRef.current) {
      console.log("Heartbeat: Deteniendo el intervalo de refresco...");
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }

  function startHeartbeat() {
    if (!refreshIntervalRef.current) {
      console.log("Heartbeat: Iniciando el intervalo de refresco...");
      refreshIntervalRef.current = setInterval(async () => {
        console.log("Heartbeat: Refrescando sesión automáticamente para evitar expiración...");
        await contextRefreshAccessToken().catch(() => {
          console.warn("Heartbeat: Falló el refresco automático. Deteniendo reloj.");
          stopHeartbeat();
        });
      }, 840000);
    }
  }

  const fetchProfile = async () => {
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
  };

  const contextRefreshAccessToken = async (): Promise<string | null> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!res.ok) {
        setUser(null);
        setAccessToken(null);
        setLoading(false);
        throw new Error(`Refresh API request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (data.accessToken && typeof data.accessToken === "string") {
        setAccessToken(data.accessToken);
        await fetchProfile();
        // [MODIFICADO]: Iniciar o asegurar que el temporizador esté activo si tenemos sesión válida
        startHeartbeat();
        return data.accessToken;
      } else {
        setUser(null);
        setAccessToken(null);
        setLoading(false);
        throw new Error(
          "Access token not found or invalid in refresh response",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("status 401")) {
        // No imprimimos error en rojo porque es normal (ej. primera carga sin estar logueado)
      } else {
        console.error("AuthContext: Failed to refresh access token:", error);
      }
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      throw error;
    }
  };

  const login = async ({ email, password }: LoginCredentials) => {
    setLoading(true);
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
        setLoading(false);
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
        setLoading(false);
      }
      throw error;
    }
  };

  const logout = async () => {
    // [MODIFICADO]: Se detiene explícitamente el temporizador de refresco antes de limpiar la sesión
    // [ANTES]: No se detenía el intervalo, por lo que la sesión podía revivir
    stopHeartbeat();

    try {
      await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("AuthContext: Logout API call failed:", error);
    }
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  useEffect(() => {
    // 1. Ejecución inmediata al cargar la app para intentar recuperar la sesión
    const initSession = async () => {
      await contextRefreshAccessToken().catch(() => {
        // Silencioso, no pasa nada si no hay sesión inicial
      });
    };

    initSession();

    // Limpieza: Al desmontar el componente (ej. cerrar app), detenemos el reloj
    return () => {
      stopHeartbeat();
    };
  }, []);

  const userRole: Role | null = user?.role.name ?? null;

  const value = useMemo(
    () => ({
      accessToken: accessToken,
      user,
      userRole,
      loading,
      login,
      refreshAccessToken: contextRefreshAccessToken,
      logout,
    }),
    [user, userRole, loading, accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
