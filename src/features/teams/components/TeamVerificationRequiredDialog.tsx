import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { setTeamVerificationRequired } from "@/features/teams/api/teamVerification";

export interface VerificationRequiredTarget {
  id: number;
  name: string;
  /** Valor actual: true = hoy se le exige el código al jurado (si el interruptor global está encendido). */
  verificationRequired: boolean;
}

interface TeamVerificationRequiredDialogProps {
  team: VerificationRequiredTarget | null;
  onClose: () => void;
  /** Se llama después de guardar, para recargar la lista. */
  onChanged: () => void;
}

/**
 * HU-50 (ARK-311): el administrador desactiva o vuelve a activar el código de verificación de un equipo.
 * El back registra quién y cuándo; reactivarlo no regenera el código ni borra las verificaciones.
 */
export function TeamVerificationRequiredDialog({
  team,
  onClose,
  onChanged,
}: TeamVerificationRequiredDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const disabling = team?.verificationRequired !== false;

  const confirm = async () => {
    if (!team || isSaving) return;
    setIsSaving(true);
    try {
      await setTeamVerificationRequired(team.id, !disabling);
      toast.success(
        disabling
          ? `Los jurados calificarán a ${team.name} sin pedir el código.`
          : `${team.name} vuelve a pedir el código de verificación.`,
      );
      onClose();
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "No se pudo cambiar el código de verificación.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AlertDialog open={team !== null} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {disabling
              ? `¿Desactivar el código de verificación de ${team?.name}?`
              : `¿Activar el código de verificación de ${team?.name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {disabling
              ? "Los jurados verán el formulario de calificación de este equipo sin digitar su código. El código no se borra y las verificaciones hechas se conservan."
              : "Los jurados que aún no verificaron este equipo tendrán que digitar su código antes de calificar. Es el mismo código de antes: no se regenera, y quienes ya lo verificaron no lo vuelven a digitar."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving} className="cursor-pointer">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // el diálogo se cierra cuando responde el back
              void confirm();
            }}
            disabled={isSaving}
            className="cursor-pointer"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {disabling ? "Desactivar código" : "Activar código"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
