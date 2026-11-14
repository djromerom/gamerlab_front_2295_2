import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  CONFIRM_RETRY_MS,
  JurorPresenceError,
  confirmMyPresence,
  fetchMyPresence,
  isRetryableConfirmError,
  nextCheckDelay,
  type MyPresence,
} from "@/features/jurors/presence/api/jurorPresence";

/** Roles con pantallas de jurado: el back les da el servicio ConfirmJurorPresence. */
const JUROR_ROLES = ["Jurado", "Profesor"];

export interface JurorPresenceState {
  presence: MyPresence | null;
  /** Mostrar "¿Sigues en la feria?". */
  promptOpen: boolean;
  confirming: boolean;
  /** "Sigo aquí" no llegó (sin conexión o 5xx): se reintenta solo. */
  retrying: boolean;
  /** Respuesta definitiva del back que el jurado debe leer (por ejemplo 409 JUROR_NOT_CHECKED_IN). */
  message: string | null;
  confirm: () => Promise<void>;
  dismissMessage: () => void;
}

const noop = async () => {};

const disabledState: JurorPresenceState = {
  presence: null,
  promptOpen: false,
  confirming: false,
  retrying: false,
  message: null,
  confirm: noop,
  dismissMessage: () => {},
};

const JurorPresenceContext = createContext<JurorPresenceState>(disabledState);

/**
 * HU-23: después del check-in, la pantalla del jurado pregunta cada cierto tiempo
 * "¿Sigues en la feria?". Consulta `GET /juror-presence/me` al abrir y cada minuto, o antes si
 * la próxima pregunta llega primero (calculada con la hora del servidor, no la del celular).
 */
export function useJurorPresenceState(enabled: boolean): JurorPresenceState {
  const [presence, setPresence] = useState<MyPresence | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Cambia en cada consulta (bien o mal) para volver a programar la siguiente.
  const [checks, setChecks] = useState(0);
  // Un 403 no cambia mientras dure la sesión: se deja de consultar.
  const [forbidden, setForbidden] = useState(false);
  const confirmingRef = useRef(false);

  useEffect(() => {
    if (enabled) return;
    setPresence(null);
    setRetrying(false);
    setMessage(null);
    setForbidden(false);
    setChecks(0);
  }, [enabled]);

  const check = useCallback(async () => {
    try {
      setPresence(await fetchMyPresence());
    } catch (err) {
      if (err instanceof JurorPresenceError) {
        if (err.status === 403) setForbidden(true);
        // Sin feria activa: no hay nada que preguntar.
        if (err.status === 404) setPresence(null);
      }
      // Sin conexión: se conserva el último estado y se vuelve a intentar en la próxima consulta.
    } finally {
      setChecks((count) => count + 1);
    }
  }, []);

  const active = enabled && !forbidden;

  // Primera consulta y las siguientes.
  useEffect(() => {
    if (!active) return;
    if (checks === 0) {
      void check();
      return;
    }
    const timeout = window.setTimeout(() => void check(), nextCheckDelay(presence));
    return () => window.clearTimeout(timeout);
    // `presence` cambia junto con `checks`; basta con `checks` para reprogramar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, checks, check]);

  // En el celular los temporizadores se pausan con la pantalla apagada: al volver, se consulta ya.
  useEffect(() => {
    if (!active) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, check]);

  const confirm = useCallback(async () => {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    setConfirming(true);
    setMessage(null);
    try {
      setPresence(await confirmMyPresence());
      setRetrying(false);
    } catch (err) {
      if (isRetryableConfirmError(err)) {
        setRetrying(true);
      } else {
        setRetrying(false);
        setMessage(err instanceof Error ? err.message : "No se pudo confirmar que sigues en la feria.");
      }
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  }, []);

  // Mientras "Sigo aquí" no llegue, la ventana sigue en pantalla y se reintenta al volver la conexión.
  useEffect(() => {
    if (!retrying || !active) return;
    const retry = () => void confirm();
    const interval = window.setInterval(retry, CONFIRM_RETRY_MS);
    window.addEventListener("online", retry);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", retry);
    };
  }, [retrying, active, confirm]);

  const dismissMessage = useCallback(() => {
    setMessage(null);
    setPresence((current) => (current ? { ...current, promptDue: false } : current));
  }, []);

  return useMemo(() => {
    if (!active) return disabledState;
    return {
      presence,
      promptOpen: Boolean(presence?.promptDue) || retrying || message !== null,
      confirming,
      retrying,
      message,
      confirm,
      dismissMessage,
    };
  }, [active, presence, retrying, message, confirming, confirm, dismissMessage]);
}

export function JurorPresenceProvider({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();
  const state = useJurorPresenceState(userRole !== null && JUROR_ROLES.includes(userRole));
  return <JurorPresenceContext.Provider value={state}>{children}</JurorPresenceContext.Provider>;
}

export function useJurorPresence(): JurorPresenceState {
  return useContext(JurorPresenceContext);
}
