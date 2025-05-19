import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import {
  LoginCredentials,
  AuthContextType,
  Role,
  UserProfile,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/me`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (res.ok) {
      const data = (await res.json()) as UserProfile;
      setUser(data);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async ({ email, password }: LoginCredentials) => {
    setLoading(true);
    const res = await fetch(
      `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/login`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!res.ok) {
      throw new Error("Login fallido");
    }

    await fetchProfile();
    setLoading(false);
  };

  const refreshAccessToken = async () => {
    try {
      await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      await fetchProfile();
    } catch {
      setUser(null);
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  useEffect(() => {
    refreshAccessToken();
  }, []);

  const userRole: Role | null = user?.role.name ?? null;

  const value: any = useMemo(
    () => ({
      accessToken: null,
      user,
      userRole,
      loading,
      login,
      refreshAccessToken,
      logout,
    }),
    [user, userRole, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
