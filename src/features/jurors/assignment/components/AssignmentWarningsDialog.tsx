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

interface AssignmentWarningsDialogProps {
  // null = cerrado
  warnings: AssignmentWarning[] | null;
  onContinue: () => void;
  onCancel: () => void;
}

export function AssignmentWarningsDialog({
  warnings,
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

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
