import { WifiOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useJurorPresence } from "@/features/jurors/presence/contexts/JurorPresenceContext";
import { presenceHelp } from "@/features/jurors/presence/api/jurorPresence";

/**
 * Ventana "¿Sigues en la feria?" (HU-23). No se cierra con Escape ni tocando fuera: solo con
 * "Sigo aquí" confirmado en el servidor. Sin conexión se queda en pantalla y se reintenta sola.
 */
export function JurorPresencePrompt() {
  const { presence, promptOpen, confirming, retrying, message, confirm, dismissMessage } = useJurorPresence();
  if (!promptOpen) return null;

  const settings = presence?.settings;

  return (
    <AlertDialog open>
      <AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Sigues en la feria?</AlertDialogTitle>
          <AlertDialogDescription>
            {presenceHelp(settings)}
            {settings && (
              <> Si no respondes en {settings.responseWindowMinutes} minutos, el administrador verá tu presencia sin confirmar.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {retrying && !message && (
          <p role="status" className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
            No pudimos enviar tu respuesta. Deja esta ventana abierta: la enviaremos apenas vuelva la conexión.
          </p>
        )}

        {message && (
          <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
            {message}
          </p>
        )}

        <AlertDialogFooter>
          {message ? (
            <Button type="button" variant="outline" onClick={dismissMessage}>
              Entendido
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={() => void confirm()} disabled={confirming} className="w-full sm:w-auto">
              {confirming ? "Enviando..." : "Sigo aquí"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
