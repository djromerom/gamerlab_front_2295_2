import { createContext, useContext } from "react";
import type React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  disabledSubstituteState,
  useSubstituteNoticesState,
  type SubstituteNoticesState,
} from "@/features/jurors/substitutes/hooks/useSubstituteNoticesState";

const SubstituteNoticesContext = createContext<SubstituteNoticesState>(disabledSubstituteState);

/**
 * HU-22 (ARK-85): avisos del suplente en todas sus pantallas. Solo el rol Jurado: los profesores
 * nunca son suplentes y el back no les da la ruta.
 */
export function SubstituteNoticesProvider({ children }: { children: React.ReactNode }) {
  const { user, userRole } = useAuth();
  const state = useSubstituteNoticesState(userRole === "Jurado" && user ? user.id : null);
  return <SubstituteNoticesContext.Provider value={state}>{children}</SubstituteNoticesContext.Provider>;
}

export function useSubstituteNotices(): SubstituteNoticesState {
  return useContext(SubstituteNoticesContext);
}
