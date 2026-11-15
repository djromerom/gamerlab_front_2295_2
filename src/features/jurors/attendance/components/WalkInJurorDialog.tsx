import { CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssignmentWarningsDialog } from "@/features/jurors/assignment/components/AssignmentWarningsDialog";
import { formatArrival } from "@/features/jurors/attendance/api/jurorAttendance";
import type { WalkInJurorCreated } from "@/features/jurors/attendance/api/walkInJurors";
import { ExistingPeopleList } from "@/features/jurors/attendance/components/ExistingPeopleList";
import { WalkInJurorForm } from "@/features/jurors/attendance/components/WalkInJurorForm";
import {
  InlineError,
  LoadingLine,
  WalkInAssignmentResultView,
  WalkInTeamProposal,
} from "@/features/jurors/attendance/components/WalkInTeamProposal";
import { useWalkInJuror, type WalkInStep } from "@/features/jurors/attendance/hooks/useWalkInJuror";
import { useWalkInTeamAssignment } from "@/features/jurors/attendance/hooks/useWalkInTeamAssignment";
import { accountEmailHint } from "@/features/jurors/attendance/lib/walkInJuror";

interface WalkInJurorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama al crear, marcar una llegada o asignar: la pantalla recarga la asistencia. */
  onChanged: () => void;
}

const TITLES: Record<WalkInStep, string> = {
  form: "Agregar jurado del día",
  existing: "Ese correo ya existe",
  similar: "Hay personas con un nombre parecido",
  created: "Jurado agregado",
};

const DESCRIPTIONS: Record<WalkInStep, string> = {
  form: "Para quien llegó a la feria sin estar registrado. Entra como suplente y se le asignan los grupos que más lo necesitan.",
  existing: "No se creó nada. Revisa qué hacer con la persona que ya tiene ese correo.",
  similar: "Todavía no se creó nada. Si es una de estas personas, usa la que existe; si no, créalo.",
  created: "Ya quedó presente. Ahora puedes asignarle grupos.",
};

function CreatedSummary({ created, resend, onResend }: { created: WalkInJurorCreated; resend: string; onResend: () => void }) {
  return (
    <div className="space-y-3 text-sm">
      <div role="status" className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
          {created.juror.name}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">Junior · Suplente</Badge>
          <Badge variant="outline">Alta del día</Badge>
          <span>Llegada a las {formatArrival(created.attendance.checkedInAt)} (manual)</span>
        </p>
      </div>
      <div className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
          {accountEmailHint(created.juror.email)}
        </p>
        <Button variant="outline" size="sm" className="shrink-0" onClick={onResend} disabled={resend === "sending" || resend === "sent"}>
          {resend === "sending" && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
          {resend === "sent" ? "Correo reenviado" : "Reenviar correo"}
        </Button>
      </div>
      {resend !== "idle" && resend !== "sending" && resend !== "sent" && <InlineError message={resend} />}
    </div>
  );
}

/**
 * «Agregar jurado del día» (HU-24, CU-24): alta con nombre, apellido y correo, llegada manual y
 * «Asignar grupos automáticamente» con la lista previa (Confirmar o Editar). Solo el administrador.
 */
export function WalkInJurorDialog({ open, onOpenChange, onChanged }: WalkInJurorDialogProps) {
  const juror = useWalkInJuror(open, onChanged);
  const teams = useWalkInTeamAssignment(juror.created?.juror.id ?? null, onChanged);
  const busy = juror.submitting || teams.submitting;
  const { suggestion, result } = teams;
  const noShortage = suggestion !== null && (suggestion.reason === "NO_SHORTAGE" || suggestion.teams.length === 0);

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    if (!next) teams.reset();
    onOpenChange(next);
  };
  const close = () => handleOpenChange(false);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[92dvh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{result ? "Grupos asignados" : TITLES[juror.step]}</DialogTitle>
            <DialogDescription>{result ? "La asignación sumó grupos sin quitarle ninguno a nadie." : DESCRIPTIONS[juror.step]}</DialogDescription>
          </DialogHeader>

          {juror.step === "form" && (
            <WalkInJurorForm
              values={juror.values}
              errors={juror.errors}
              submitting={juror.submitting}
              onChange={juror.setValue}
              onSubmit={juror.submit}
              onCancel={close}
            />
          )}

          {(juror.step === "existing" || juror.step === "similar") && (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto text-sm">
                {juror.notice && <p className="rounded-md border bg-muted/40 p-3">{juror.notice}</p>}
                <ExistingPeopleList
                  people={juror.people}
                  checkIns={juror.checkIns}
                  onCheckIn={juror.checkIn}
                  sameEmail={juror.step === "existing"}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={juror.backToForm} disabled={juror.submitting}>
                  Corregir datos
                </Button>
                {juror.step === "similar" ? (
                  <Button onClick={juror.createAnyway} disabled={juror.submitting}>
                    {juror.submitting && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
                    No es ninguno, crear
                  </Button>
                ) : (
                  <Button onClick={close}>Cerrar</Button>
                )}
              </DialogFooter>
            </>
          )}

          {juror.step === "created" && juror.created && (
            <>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                {result ? (
                  <WalkInAssignmentResultView result={result} />
                ) : (
                  <>
                    <CreatedSummary created={juror.created} resend={juror.resend} onResend={juror.resendEmail} />
                    {teams.loading && <LoadingLine text="Buscando los grupos que más lo necesitan..." />}
                    {teams.loadError && <InlineError message={teams.loadError} />}
                    {suggestion && !teams.loading && (
                      <WalkInTeamProposal
                        suggestion={suggestion}
                        options={teams.options}
                        selected={teams.selected}
                        editing={teams.editing}
                        onToggle={teams.toggle}
                      />
                    )}
                    {teams.error && <InlineError message={teams.error} />}
                  </>
                )}
              </div>
              <DialogFooter>
                {result || noShortage ? (
                  <Button onClick={close}>Cerrar</Button>
                ) : suggestion && !teams.loading ? (
                  <>
                    {!teams.editing && (
                      <Button variant="outline" onClick={teams.edit} disabled={teams.submitting}>
                        Editar
                      </Button>
                    )}
                    <Button onClick={teams.assign} disabled={teams.submitting || teams.selected.length === 0}>
                      {teams.submitting && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
                      {teams.submitting ? "Asignando..." : "Confirmar"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={close}>
                      Cerrar
                    </Button>
                    <Button onClick={teams.propose} disabled={teams.loading}>
                      <Sparkles className="mr-2 size-4" aria-hidden />
                      {teams.loadError ? "Reintentar" : "Asignar grupos automáticamente"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* HU-08: las mismas advertencias que al asignar a mano; «Continuar» repite con confirmWarnings */}
      <AssignmentWarningsDialog
        warnings={teams.warnings.warnings}
        onContinue={teams.warnings.continueWithWarnings}
        onCancel={teams.warnings.cancel}
      />
    </>
  );
}
