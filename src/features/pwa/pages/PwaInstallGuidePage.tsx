import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import LayoutApplication from "@/layouts/LayoutApplication";
import { Button } from "@/components/ui/button";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  isIosDevice,
  isPwaInstalled,
  PWA_INSTALL_PROMPT_EVENT,
} from "@/lib/pwa";

export default function PwaInstallGuidePage() {
  const [installPrompt, setInstallPrompt] = useState(getDeferredInstallPrompt);
  const [installed, setInstalled] = useState(isPwaInstalled);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const isIos = isIosDevice();

  useEffect(() => {
    const syncInstallState = () => {
      setInstallPrompt(getDeferredInstallPrompt());
      setInstalled(isPwaInstalled());
    };
    window.addEventListener(PWA_INSTALL_PROMPT_EVENT, syncInstallState);
    window.addEventListener("appinstalled", syncInstallState);
    return () => {
      window.removeEventListener(PWA_INSTALL_PROMPT_EVENT, syncInstallState);
      window.removeEventListener("appinstalled", syncInstallState);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    setInstallError(null);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      clearDeferredInstallPrompt();
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : "No se pudo iniciar la instalación.");
    } finally {
      setInstalling(false);
    }
  };

  return (
    <LayoutApplication breadcrumbs={[{ label: "Instalar ARKAD", href: "/instalar-app" }]}>
      <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Smartphone className="size-8 shrink-0" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold">Instala ARKAD en tu celular</h1>
            <p className="text-sm text-muted-foreground">
              Abre ARKAD desde tu pantalla de inicio y califica sin buscar la pestaña del navegador.
            </p>
          </div>
        </div>

        {!window.isSecureContext && (
          <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            La instalación requiere una conexión segura HTTPS. Abre ARKAD desde su dirección segura.
          </p>
        )}

        {installed && (
          <p role="status" className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm">
            ARKAD ya está instalada en este dispositivo.
          </p>
        )}

        {!installed && !isIos && installPrompt && (
          <Button type="button" onClick={install} disabled={installing}>
            {installing ? "Abriendo opciones de instalación..." : "Instalar ARKAD"}
          </Button>
        )}
        {installError && (
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
            {installError}
          </p>
        )}

        <section className="space-y-2 rounded-lg border p-5">
          <h2 className="text-lg font-semibold">Android · Chrome</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Abre ARKAD en Chrome usando la dirección HTTPS.</li>
            <li>
              Toca <strong className="text-foreground">Instalar ARKAD</strong> si aparece el botón;
              también puedes abrir el menú ⋮ y elegir «Instalar aplicación» o «Agregar a pantalla
              principal».
            </li>
            <li>Confirma la instalación. ARKAD aparecerá en tu pantalla de inicio.</li>
          </ol>
        </section>

        <section className="space-y-2 rounded-lg border p-5">
          <h2 className="text-lg font-semibold">iPhone · Safari</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Abre ARKAD en Safari usando la dirección HTTPS.</li>
            <li>Toca el botón Compartir (el cuadrado con la flecha hacia arriba).</li>
            <li>Elige «Agregar a pantalla de inicio» y confirma con «Agregar».</li>
            <li>Abre ARKAD desde el nuevo ícono para usarla en pantalla completa.</li>
          </ol>
          {!isIos && (
            <p className="pt-2 text-sm text-muted-foreground">
              En iPhone, la instalación se realiza desde Safari con estos pasos; no necesitas un
              botón de instalación dentro de la página.
            </p>
          )}
        </section>
      </main>
    </LayoutApplication>
  );
}
