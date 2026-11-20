import type React from "react";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch.tsx";
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
import { updateEventSetting } from "@/features/editions/api/eventSettings";

/** Diálogo que se muestra antes de guardar un cambio (p. ej. liberar notas con equipos en proceso, HU-46). */
export interface EventSetupConfirmation {
  title: string;
  description: React.ReactNode;
  action: string;
}

interface EventSetupCardProps {
  value: boolean;
  title: string;
  subtitle: string;
  /** Ruta del PATCH /settings/... Se ignora si se pasa `save`. */
  url?: string;
  /** Campo del body del PATCH (por defecto «show») */
  field?: string;
  /** Guardado propio, para interruptores que no van a /settings (p. ej. PATCH /final-grade/release) */
  save?: (value: boolean) => Promise<void>;
  /** Texto de ayuda bajo el interruptor */
  hint?: string;
  /** Deshabilita el interruptor (p. ej. antes de la hora de cierre de la feria) */
  disabled?: boolean;
  /** Si devuelve un diálogo, se pide confirmación antes de guardar el valor nuevo */
  confirm?: (value: boolean) => EventSetupConfirmation | null;
  /** Avisa el valor guardado, para que la página (y el contexto global) no queden con el valor viejo */
  onChange?: (value: boolean) => void;
  /** Contenido extra bajo el texto de ayuda */
  children?: React.ReactNode;
}

const EventSetupCard: React.FC<EventSetupCardProps> = ({
  value,
  url,
  title,
  subtitle,
  field,
  save,
  hint,
  disabled = false,
  confirm,
  onChange,
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(value);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ value: boolean; dialog: EventSetupConfirmation } | null>(null);

  // El valor llega del contexto global después de montar: antes el interruptor se quedaba con el inicial
  useEffect(() => {
    setIsOpen(value);
  }, [value]);

  const persist = async (newValue: boolean) => {
    setIsOpen(newValue);
    setError(null);
    setLoading(true);
    try {
      if (save) await save(newValue);
      else if (url) await updateEventSetting(url, field ?? "show", newValue);
      onChange?.(newValue);
    } catch (err) {
      // se revierte y se muestra el motivo (p. ej. publicar el ranking sin liberar la nota final, BG-67)
      setIsOpen(!newValue);
      setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const newValue = !isOpen;
    const dialog = confirm?.(newValue) ?? null;
    if (dialog) {
      setPending({ value: newValue, dialog });
      return;
    }
    await persist(newValue);
  };

  const confirmPending = async () => {
    if (!pending) return;
    const next = pending.value;
    setPending(null);
    await persist(next);
  };

  return (
    <div className="sm:flex-[0_1_10%] md:mb-6 space-y-2 border-2 rounded-lg overflow-hidden  md:w-full shadow-sm ">
      <div className="border-b last:border-b-0">
        <div className="w-full p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-medium ">{title}</span>
          </div>
          <span className="text-sm opacity-70">Estado </span>
        </div>
        <div className="px-4 py-3  border-t space-y-2">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm ">{subtitle}</p>
            <div>
              <Switch
                checked={isOpen}
                onCheckedChange={handleToggle}
                disabled={loading || disabled}
                className="cursor-pointer bg-purple-800 disabled:cursor-not-allowed"
                aria-label={title}
              />
            </div>
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {children}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {confirm && (
        <AlertDialog
          open={pending !== null}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{pending?.dialog.title}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>{pending?.dialog.description}</div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmPending}>{pending?.dialog.action}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default EventSetupCard;
