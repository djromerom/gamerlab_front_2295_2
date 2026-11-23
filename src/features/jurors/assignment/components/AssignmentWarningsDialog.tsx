import { AlertTriangle } from "lucide-react";
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
  isValidationUnavailable,
  type AssignmentWarning,
} from "@/features/jurors/assignment/lib/assignmentWarnings";

/** Equipo que no se asignará aunque se continúe (HU-42, `blocked` del 409 en lote). */
export interface BlockedItem {
  key: string | number;
  label: string;
  message: string;
}

interface AssignmentWarningsDialogProps {
  // null = cerrado
  warnings: AssignmentWarning[] | null;
  /** Equipos bloqueados: se listan aparte para que el admin sepa qué no se guardará. */
  blocked?: BlockedItem[];
  onContinue: () => void;
  onCancel: () => void;
}

export function AssignmentWarningsDialog({
  warnings,
  blocked = [],
  onContinue,
  onCancel,
}: AssignmentWarningsDialogProps) {
  const list = warnings ?? [];
  const unavailable = isValidationUnavailable(list);

  return (
    <AlertDialog
      open={warnings !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent
        // El modal de asignar escucha Escape en document: sin esto se cerrarían los dos
        onEscapeKeyDown={(event) => event.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            {unavailable
              ? "No se pudieron comprobar las reglas"
              : "La asignación rompe reglas de la feria"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {unavailable
              ? "No se pudieron comprobar las reglas de asignación. ¿Guardar de todos modos?"
              : "Todavía no se guardó nada. Revisa las advertencias y decide si continuar."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {list.length > 0 && (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {list.map((warning, index) => (
              <li
                key={`${warning.code}-${index}`}
                className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
              >
                {warning.message}
              </li>
            ))}
          </ul>
        )}

        {blocked.length > 0 && (
          <section aria-label="Equipos que no se asignarán" className="space-y-2">
            <p className="text-sm font-medium">
              {blocked.length === 1
                ? "Este equipo no se asignará aunque continúes:"
                : `Estos ${blocked.length} equipos no se asignarán aunque continúes:`}
            </p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {blocked.map((item) => (
                <li
                  key={item.key}
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{item.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
