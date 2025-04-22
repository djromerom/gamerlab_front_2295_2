import { createContext, useEffect, useContext, useState } from "react";
import { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "../../supabase/client";
import React from "react";

interface Context {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

interface Props {
  children: React.ReactNode;
}

export const AuthContext = createContext<Context | undefined>(undefined);

export const AuthContextProvider = ({ children }: Props) => {
  const [user, setUser] = useState<Context["user"]>(null);
  const [loading, setLoading] = useState<Context["loading"]>(true);
  const [error, setError] = useState<Context["error"]>(null);

  const logIn: Context["logIn"] = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setError(error);
      setUser(data.user);
    } catch (error: any) {
      console.error("An error occurred:", error);
    }
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
    getCurrentUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, logIn, logOut, loading, error }}>
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
