import { useCallback, useEffect, useState } from "react";
import {
  fetchVerificationCodesSetting,
  updateVerificationCodesSetting,
  type VerificationCodesSetting,
} from "@/features/editions/api/eventSettings";

/** Estado del interruptor global del código de verificación (HU-50, ARK-311). */
export function useVerificationCodesSetting() {
  const [setting, setSetting] = useState<VerificationCodesSetting | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setSetting(await fetchVerificationCodesSetting());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar el código de verificación.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Guarda el cambio; si el back lo rechaza, lanza el error para que la tarjeta se revierta y lo muestre. */
  const save = useCallback(async (enabled: boolean) => {
    setSetting(await updateVerificationCodesSetting(enabled));
  }, []);

  return { setting, loadError, reload: load, save };
}
