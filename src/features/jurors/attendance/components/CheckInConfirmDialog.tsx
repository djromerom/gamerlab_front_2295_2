import React from "react";
import { Loader2, QrCode, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatArrival } from "@/features/jurors/attendance/api/jurorAttendance";

/** Jurado a confirmar antes de registrar su llegada (ARK-252), venga de la búsqueda o del QR. */
export interface CheckInCandidate {
  source: "search" | "qr";
  name: string;
  /** Ya resuelta para quien mira: el Staff ve «Jurado» (HU-35) */
  categoryLabel: string;
  hasBadge?: boolean;
  checkedInAt: string | null;
  teams?: { id: number; name: string }[];
}

interface CheckInConfirmDialogProps {
  candidate: CheckInCandidate | null;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Antes, tocar un resultado o leer un QR registraba la llegada de inmediato, y así se registraron por error dos
 * jurados en Arkad-test (BG-49). Ahora se confirma viendo el nombre.
 */
export const CheckInConfirmDialog: React.FC<CheckInConfirmDialogProps> = ({ candidate, submitting, onConfirm, onCancel }) => (
  <Dialog open={candidate !== null} onOpenChange={(open) => !open && !submitting && onCancel()}>
    <DialogContent className="sm:max-w-md">
      {candidate && (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {candidate.source === "qr" ? <QrCode className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              ¿Registrar la llegada?
            </DialogTitle>
            <DialogDescription>
              {candidate.source === "qr"
                ? "Revisa que el nombre sea el del jurado que tienes al frente: el escáner puede leer el QR de al lado."
                : "Revisa que sea el jurado que tienes al frente."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border p-4">
            <p className="break-words text-xl font-semibold">{candidate.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {candidate.categoryLabel}
              {candidate.hasBadge !== undefined && (candidate.hasBadge ? " · Tiene escarapela" : " · Sin escarapela")}
            </p>
            {candidate.teams && (
              <p className="mt-1 text-sm text-muted-foreground">
                {candidate.teams.length ? `Grupos: ${candidate.teams.map((team) => team.name).join(", ")}` : "Grupos: sin asignar"}
              </p>
            )}
            {candidate.checkedInAt && (
              <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                Ya llegó: {formatArrival(candidate.checkedInAt)}. Si confirmas, no se registra otra vez.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting} className="min-h-11">
              Cancelar
            </Button>
            <Button type="button" onClick={onConfirm} disabled={submitting} className="min-h-11">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
              Confirmar llegada
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  </Dialog>
);
