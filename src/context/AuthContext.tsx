import { createContext, useEffect, useContext, useState } from "react";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "../../supabase/client";
import React from "react";

interface Context {
  user: User | null;
  loading: boolean;
  error: AuthError | null | any;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoggingIn: boolean;
  isInRecoveryFlow: boolean;
  rol: "admin" | "jurado" | "estudiante" | null;
}

interface Props {
  children: React.ReactNode;
}

export const AuthContext = createContext<Context | undefined>(undefined);

export const AuthContextProvider = ({ children }: Props) => {
  const [rol, setRol] = useState<Context["rol"]>(null);
  const [user, setUser] = useState<Context["user"]>(null);
  const [loading, setLoading] = useState<Context["loading"]>(true);
  const [error, setError] = useState<Context["error"]>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<Context["isLoggingIn"]>(false);
  const [isInRecoveryFlow, setIsInRecoveryFlow] =
    useState<Context["isInRecoveryFlow"]>(false);

  const logIn: Context["logIn"] = async (email, password) => {
    try {
      setIsLoggingIn(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setError(error);
      setUser(data.user);
      if (data.user) {
        const { data: perfil, error: perfilError } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id", data.user.id)
          .single();
        if (perfilError) {
          console.error("Error al obtener el rol:", perfilError.message);
          setError(perfilError);
          return;
        }
        setRol(perfil.rol);
        console.log(rol);
      }
    } catch (error: any) {
      console.error("An error occurred:", error);
      setError(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const resetPassword: Context["resetPassword"] = async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
  };

  const logOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsInRecoveryFlow(true);
    } else {
      setIsInRecoveryFlow(false);
    }
    getCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        logIn,
        logOut,
        loading,
        error,
        isLoggingIn,
        resetPassword,
        isInRecoveryFlow,
        rol,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within a AuthContextProvider");
  }

  return context;
};
