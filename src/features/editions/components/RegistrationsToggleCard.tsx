import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchRegistrationReadiness,
  readRegistrationsOpen,
  updateRegistrationsOpen,
  type RegistrationReadiness,
} from "@/api/registrations";

/** ARK-136 (BG-23): orden recomendado para preparar una edición. */
export const REGISTRATION_ORDER_HINT =
  "Orden recomendado: crea y activa la edición, carga sus NRC y después abre las inscripciones.";

const RegistrationsToggleCard: React.FC = () => {
  const [open, setOpen] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ARK-136: aviso cuando se van a abrir las inscripciones y la edición activa no tiene NRC
  const [noNrcWarning, setNoNrcWarning] = useState<RegistrationReadiness | null>(null);

  useEffect(() => {
    let active = true;
    readRegistrationsOpen()
      .then((value) => {
        if (active) setOpen(value);
      })
      .catch(() => {
        if (active) setError("No se pudo cargar el estado de las inscripciones.");
      });
    return () => {
      active = false;
    };
  }, []);

  const applyChange = async (next: boolean) => {
    setSaving(true);
    setError(null);
    try {
      setOpen(await updateRegistrationsOpen(next));
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` ${err.message}` : "";
      setError(`No se pudo actualizar las inscripciones.${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (open === null) return;
    const next = !open;
    if (next) {
      // Solo informa: si no se puede revisar, se abren igual (el back no lo bloquea).
      setSaving(true);
      const readiness = await fetchRegistrationReadiness().catch(() => null);
      setSaving(false);
      if (readiness?.hasActiveNrcs === false) {
        setNoNrcWarning(readiness);
        return;
      }
    }
    await applyChange(next);
  };

  const confirmOpenWithoutNrcs = async () => {
    setNoNrcWarning(null);
    await applyChange(true);
  };

  const editionName = noNrcWarning?.edition?.title
    ? `«${noNrcWarning.edition.title}»`
    : "La edición activa";

  return (
    <>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="sm:flex-[0_1_10%] md:mb-6 space-y-2 border-2 rounded-lg overflow-hidden md:w-full shadow-sm">
        <div className="border-b last:border-b-0">
          <div className="w-full p-4 flex items-center justify-between transition-colors">
            <span className="font-medium">Inscripciones de equipos</span>
            <span className="text-sm opacity-70">
              {open === null ? (error ? "Sin datos" : "Cargando...") : open ? "Abiertas" : "Cerradas"}
            </span>
          </div>
          <div className="px-4 py-3 border-t">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm">
                  Permite que cualquier persona registre su equipo desde la web.
                </p>
                <p className="text-xs opacity-70">{REGISTRATION_ORDER_HINT}</p>
              </div>
              <Switch
                aria-label="Inscripciones de equipos"
                checked={open === true}
                onCheckedChange={handleToggle}
                disabled={open === null || saving}
                className="cursor-pointer bg-purple-800"
              />
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={noNrcWarning !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setNoNrcWarning(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>La edición no tiene NRC activos</AlertDialogTitle>
            <AlertDialogDescription>
              {editionName} todavía no tiene NRC activos. Cada equipo debe elegir al menos un NRC, así
              que nadie podrá terminar la inscripción hasta que los cargues en la página de NRC.
              ¿Quieres abrir las inscripciones de todas formas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOpenWithoutNrcs}>Abrir de todas formas</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RegistrationsToggleCard;
