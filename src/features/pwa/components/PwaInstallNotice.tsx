import { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPwaInstalled } from "@/lib/pwa";

// HU ARK-198: aviso para que el jurado instale ARKAD en su celular.
// Solo aparece en pantallas táctiles, si la app no está instalada y si no lo ha cerrado antes.
export const PWA_INSTALL_NOTICE_DISMISSED_KEY = "arkad:pwa-install-notice-dismissed";

function isTouchDevice(): boolean {
  return typeof window.matchMedia === "function"
    && window.matchMedia("(pointer: coarse)").matches;
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(PWA_INSTALL_NOTICE_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed(): void {
  try {
    window.localStorage.setItem(PWA_INSTALL_NOTICE_DISMISSED_KEY, "1");
  } catch {
    // Sin almacenamiento (modo privado): el aviso solo se oculta en esta visita
  }
}

export function PwaInstallNotice({ className = "" }: { className?: string }) {
  const [visible, setVisible] = useState(
    () => isTouchDevice() && !isPwaInstalled() && !wasDismissed(),
  );

  if (!visible) return null;

  const dismiss = () => {
    rememberDismissed();
    setVisible(false);
  };

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 text-sm ${className}`}
    >
      <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Instala ARKAD en tu celular</p>
        <p className="mt-1 text-muted-foreground">
          Ábrela desde tu pantalla de inicio y califica sin buscar la pestaña del navegador.
        </p>
        <Link to="/instalar-app" className="mt-2 inline-block font-medium underline underline-offset-4">
          Ver cómo instalarla
        </Link>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Cerrar aviso de instalación"
        onClick={dismiss}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
