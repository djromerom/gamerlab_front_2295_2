import React, { useEffect, useState } from "react";
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ANNUL_REASON_MAX,
  AnnulArrivalError,
  METHOD_LABEL,
  annulJurorArrival,
  formatArrival,
  type JurorAttendanceItem,
} from "@/features/jurors/attendance/api/jurorAttendance";

interface AnnulArrivalDialogProps {
  /** Fila presente a anular; null cierra el diálogo */
  juror: JurorAttendanceItem | null;
  onClose: () => void;
  /** Después de anular (o si la tabla quedó vieja: 404 y 409), para volver a consultar la tabla */
  onChanged: () => void;
}

/**
 * BG-49 (ARK-252): el Administrador anula una llegada registrada por error. La llegada queda guardada como anulada
 * (quién, cuándo y el motivo) y el jurado vuelve a «Falta». El botón se deshabilita mientras se envía, para no
 * provocar el 409 con un doble clic.
 */
export const AnnulArrivalDialog: React.FC<AnnulArrivalDialogProps> = ({ juror, onClose, onChanged }) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReason("");
    setError(null);
  }, [juror?.attendanceId]);

  const annul = async () => {
    if (!juror?.attendanceId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const annulled = await annulJurorArrival(juror.attendanceId, reason);
      toast.success(`Se anuló la llegada de ${annulled.juror.name}`, { description: "Vuelve a aparecer como «Falta»." });
      onChanged();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo anular la llegada.";
      if (err instanceof AnnulArrivalError && (err.status === 404 || err.status === 409)) {
        // la tabla estaba vieja: otro administrador ya la anuló o la llegada ya no existe
        toast.info(message);
        onChanged();
        onClose();
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={juror !== null} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        {juror && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                ¿Anular la llegada?
              </DialogTitle>
              <DialogDescription>
                El jurado vuelve a «Falta» en la asistencia, la alerta de inasistencia y la presencia. La llegada queda
                guardada como anulada, con quién la anuló y cuándo. Si sí está en la feria, regístralo otra vez en el
                check-in.
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border p-4 text-sm">
              <dt className="text-muted-foreground">Jurado</dt>
              <dd className="break-words font-semibold">{juror.name}</dd>
              <dt className="text-muted-foreground">Llegada</dt>
              <dd>
                {formatArrival(juror.checkedInAt)}
                {juror.method && ` · ${METHOD_LABEL[juror.method]}`}
              </dd>
              <dt className="text-muted-foreground">Registró</dt>
              <dd className="break-words">{juror.checkedInBy?.name ?? "—"}</dd>
            </dl>

            <div className="space-y-1.5">
              <Label htmlFor="annul-reason">Motivo (opcional)</Label>
              <Textarea
                id="annul-reason"
                value={reason}
                maxLength={ANNUL_REASON_MAX}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Por ejemplo: el escáner leyó el QR del jurado de al lado"
                className="text-base"
                disabled={submitting}
              />
              <p className="text-right text-xs text-muted-foreground">
                {reason.length}/{ANNUL_REASON_MAX}
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="min-h-11">
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={() => void annul()} disabled={submitting} className="min-h-11">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                Anular llegada
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
