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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
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
        }
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
        return data.accessToken;
      } else {
        setUser(null);
        setAccessToken(null);
        setLoading(false);
        throw new Error(
          "Access token not found or invalid in refresh response"
        );
      }
    } catch (error) {
      console.error("AuthContext: Failed to refresh access token:", error);
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      throw error;
    }
  };

  const login = async ({ email, password }: LoginCredentials) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
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
    try {
      await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("AuthContext: Logout API call failed:", error);
    }
    setUser(null);
    setAccessToken(null);
    setLoading(false);
  };

  useEffect(() => {
    contextRefreshAccessToken().catch(() => {});
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
    [user, userRole, loading, accessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
