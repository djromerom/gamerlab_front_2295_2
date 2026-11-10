import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PwaUpdateNotice() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let active = true;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;

    const checkForWaitingWorker = () => {
      if (registration?.waiting && navigator.serviceWorker.controller) {
        setAvailable(true);
      }
    };

    const watchInstallingWorker = () => {
      installingWorker?.removeEventListener("statechange", checkForWaitingWorker);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener("statechange", checkForWaitingWorker);
    };

    let intervalId: number | undefined;
    navigator.serviceWorker.getRegistration("/")
      .then((currentRegistration) => currentRegistration ?? navigator.serviceWorker.ready)
      .then((currentRegistration) => {
        if (!active) return;
        registration = currentRegistration;
        checkForWaitingWorker();
        registration.addEventListener("updatefound", watchInstallingWorker);
        intervalId = window.setInterval(() => {
          void registration?.update().catch((error: unknown) => {
            console.error("No se pudo comprobar si hay una actualización de ARKAD:", error);
          });
        }, 60 * 60 * 1000);
      })
      .catch((error: unknown) => {
        console.error("No se pudo consultar la actualización de ARKAD:", error);
      });

    return () => {
      active = false;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      registration?.removeEventListener("updatefound", watchInstallingWorker);
      installingWorker?.removeEventListener("statechange", checkForWaitingWorker);
    };
  }, []);

  if (!available) return null;

  return (
    <div
      role="status"
      className="mx-4 mt-3 flex items-start gap-3 rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 text-sm"
    >
      <RefreshCw className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Hay una nueva versión de ARKAD lista.</p>
        <p className="mt-1 text-muted-foreground">
          Para actualizar sin perder avances, guarda o envía tu trabajo y cierra las pestañas
          abiertas de ARKAD. La nueva versión estará activa al volver a abrirla.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Cerrar aviso de actualización"
        onClick={() => setAvailable(false)}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
