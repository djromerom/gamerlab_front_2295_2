import { useCallback, useRef, useState } from "react";
import {
  checkInJurorManually,
  previewJurorBadge,
  scanJurorBadge,
  type CheckInResult,
  type JurorSearchItem,
} from "@/features/jurors/attendance/api/jurorCheckIn";
import type { CheckInCandidate } from "@/features/jurors/attendance/components/CheckInConfirmDialog";

interface Pending {
  candidate: CheckInCandidate;
  register: () => Promise<CheckInResult>;
  /** Solo en los QR: para no volver a ofrecer el mismo QR apenas se cierra la confirmación */
  token?: string;
}

/**
 * Tras confirmar o cancelar un QR, el mismo QR se ignora este tiempo: si sigue frente a la cámara (o es el de al
 * lado que se acaba de cancelar), no vuelve a abrir la confirmación de inmediato.
 */
export const SAME_QR_PAUSE_MS = 8000;

interface Options {
  /** Etiqueta de la categoría para quien mira (el Staff ve «Jurado», HU-35) */
  categoryLabel: (category: string) => string;
  onResult: (result: CheckInResult) => void;
  onError: (message: string) => void;
  /** Al empezar a leer un QR nuevo (para limpiar el error anterior) */
  onStart?: () => void;
}

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

/**
 * ARK-252: ningún registro de llegada con un solo toque. Tocar un resultado de la búsqueda o leer un QR abre la
 * confirmación con el nombre del jurado, y la llegada solo se registra con «Confirmar llegada».
 * Mientras hay una confirmación abierta (o se está leyendo un QR) se ignoran otros escaneos.
 */
export function useCheckInConfirmation({ categoryLabel, onResult, onError, onStart }: Options) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const busyRef = useRef(false);
  const recentQrRef = useRef<{ token: string; until: number } | null>(null);

  const open = (next: Pending) => {
    busyRef.current = true;
    setPending(next);
  };

  const askForSearchResult = (juror: JurorSearchItem) => {
    if (busyRef.current) return;
    open({
      candidate: {
        source: "search",
        name: juror.name,
        categoryLabel: categoryLabel(juror.category),
        hasBadge: juror.hasBadge,
        checkedInAt: juror.checkedInAt,
      },
      register: () => checkInJurorManually(juror.id),
    });
  };

  /** Lee de quién es el QR sin registrar. Devuelve false si se ignoró (ya hay una confirmación en curso). */
  const askForQr = useCallback(
    async (token: string): Promise<boolean> => {
      if (busyRef.current) return false;
      const recent = recentQrRef.current;
      if (recent && recent.token === token && Date.now() < recent.until) return false;
      busyRef.current = true;
      onStart?.();
      setPreviewing(true);
      try {
        const preview = await previewJurorBadge(token);
        setPending({
          candidate: {
            source: "qr",
            name: preview.juror.name,
            categoryLabel: categoryLabel(preview.juror.category),
            teams: preview.juror.teams,
            checkedInAt: preview.checkedInAt,
          },
          register: () => scanJurorBadge(token),
          token,
        });
      } catch (err) {
        busyRef.current = false;
        recentQrRef.current = { token, until: Date.now() + SAME_QR_PAUSE_MS };
        onError(errorText(err, "Código QR no válido"));
      } finally {
        setPreviewing(false);
      }
      return true;
    },
    [categoryLabel, onError, onStart],
  );

  const close = () => {
    if (pending?.token) recentQrRef.current = { token: pending.token, until: Date.now() + SAME_QR_PAUSE_MS };
    busyRef.current = false;
    setPending(null);
  };

  const confirm = async () => {
    if (!pending || submitting) return;
    setSubmitting(true);
    try {
      onResult(await pending.register());
      close();
    } catch (err) {
      onError(errorText(err, "No se pudo registrar la llegada"));
      close();
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => {
    if (!submitting) close();
  };

  return {
    candidate: pending?.candidate ?? null,
    submitting,
    previewing,
    askForSearchResult,
    askForQr,
    confirm,
    cancel,
  };
}
