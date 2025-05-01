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
    const res = await fetch("http://localhost:3000/auth/me", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = (await res.json()) as UserProfile;
      setUser(data);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async ({ email, password }: LoginCredentials) => {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Login fallido");
    }

    await fetchProfile();
  };

  const refreshAccessToken = async () => {
    try {
      await fetch("http://localhost:3000/auth/refresh", {
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
    await fetch("http://localhost:3000/auth/logout", {
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
      accessToken: null, // No accesible por HttpOnly
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
