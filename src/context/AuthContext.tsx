import { createContext, useEffect, useContext, useState } from "react";
import { AuthError, PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../supabase/client";
import React from "react";

export interface User {
  id_usuario: string;
  id_rol: 1 | 2 | 3;
  nombre: string;
  correo: string;
  estado_confirmacion: Boolean;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

interface Context {
  user: User | null;
  loading: boolean;
  error: AuthError | PostgrestError | null;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoggingIn: boolean;
  isInRecoveryFlow: boolean;
}

interface Props {
  children: React.ReactNode;
}

export const AuthContext = createContext<Context | undefined>(undefined);

export const AuthContextProvider = ({ children }: Props) => {
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
      if (data.user) {
        let { data: user, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id_usuario", data.user.id)
          .single();
        setError(error);
        setUser(user);
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
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) {
      let { data: userInfo, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id_usuario", currentUser.id)
        .single();
      setUser(userInfo);
    }
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
