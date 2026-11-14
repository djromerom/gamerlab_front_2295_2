import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssignmentWarningsDialog } from "@/features/jurors/assignment/components/AssignmentWarningsDialog";
import { EvaluatorChecklist } from "@/features/jurors/assignment/components/EvaluatorChecklist";
import { useBulkSubstituteAssignment } from "@/features/jurors/assignment/hooks/useBulkSubstituteAssignment";
import type { BulkSubstituteAssignmentResult } from "@/features/jurors/assignment/api/bulkSubstitutes";
import {
  categoryLabel,
  coverageSummary,
  evaluatorRole,
  groupsText,
  plural,
  resultNotes,
} from "@/features/jurors/assignment/lib/bulkSubstitutes";

interface BulkSubstituteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama al guardar: la pantalla recarga equipos y jurados. */
  onAssigned: () => void;
}

const HELP =
  "Los suplentes se suman a todos los grupos de los jurados elegidos. Nadie pierde grupos y las evaluaciones hechas se conservan.";

function ResultView({ result }: { result: BulkSubstituteAssignmentResult }) {
  const notes = resultNotes(result);
  return (
    <div className="space-y-3 text-sm" role="status">
      <p className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        {result.message}
      </p>
      <ul className="space-y-2">
        {result.suplentes.map((s) => (
          <li key={s.id} className="rounded-md border p-3">
            <p className="font-medium">{s.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {plural(s.equiposAgregados.length, "grupo nuevo", "grupos nuevos")}
              {s.equiposYaAsignados.length > 0 && ` · ${s.equiposYaAsignados.length} ya los tenía`}
            </p>
            {s.equiposAgregados.length > 0 && (
              <p className="mt-1 text-xs">{s.equiposAgregados.map((t) => `${t.codigo} ${t.nombre}`).join(" · ")}</p>
            )}
          </li>
        ))}
      </ul>
      {notes.map((note) => (
        <p key={note} className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          {note}
        </p>
      ))}
      {result.totales.asignacionesAgregadas > 0 && (
        <p className="text-xs text-muted-foreground">Cada suplente recibe el aviso «Te asignaron grupos» y un correo.</p>
      )}
    </div>
  );
}

/**
 * «Cubrir jurados con suplentes» (HU-09, CU-09): el admin elige los jurados que no llegaron y los
 * suplentes; cada suplente se suma a todos los grupos de esos jurados en una sola operación.
 */
export function BulkSubstituteDialog({ open, onOpenChange, onAssigned }: BulkSubstituteDialogProps) {
  const state = useBulkSubstituteAssignment(open, onAssigned);
  const { coverable, substitutes, jurorIds, substituteIds, result } = state;
  const chosenCovered = coverable.filter((e) => jurorIds.includes(e.id));
  const chosenSubs = substitutes.filter((e) => substituteIds.includes(e.id));
  const disabledSubs = Object.fromEntries(jurorIds.map((id) => [id, "Está elegido como jurado a cubrir"]));

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !state.submitting && onOpenChange(next)}>
        <DialogContent className="flex max-h-[92dvh] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cubrir jurados con suplentes</DialogTitle>
            <DialogDescription>{HELP}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {result ? (
              <ResultView result={result} />
            ) : state.loading ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando jurados...
              </p>
            ) : state.loadError ? (
              <div className="flex flex-col items-center gap-3 py-8 text-sm text-destructive">
                <p role="alert">{state.loadError}</p>
                <Button variant="outline" size="sm" onClick={() => void state.reload()}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <EvaluatorChecklist
                  title="1. Jurados a cubrir"
                  label="Jurados a cubrir"
                  items={coverable}
                  selected={jurorIds}
                  onToggle={state.toggleJuror}
                  describe={(e) => `${evaluatorRole(e)} · ${groupsText(e.assignedTeams)}`}
                  emptyText="Ningún jurado tiene grupos en la edición activa."
                />
                <EvaluatorChecklist
                  title="2. Suplentes"
                  label="Suplentes"
                  items={substitutes}
                  selected={substituteIds}
                  onToggle={state.toggleSubstitute}
                  describe={(e) => `${categoryLabel(e)} · ${e.assignedTeams > 0 ? `ya tiene ${groupsText(e.assignedTeams)}` : "sin grupos"}`}
                  disabled={disabledSubs}
                  emptyText="No hay suplentes confirmados. Márcalos como Suplente en Jurados de la edición."
                />
              </div>
            )}
          </div>

          {!result && !state.loading && !state.loadError && (
            <div className="space-y-2 text-sm">
              {chosenCovered.length > 0 && chosenSubs.length > 0 && !state.problem && (
                <p className="rounded-md border bg-muted/40 p-2.5">{coverageSummary(chosenCovered, chosenSubs)}</p>
              )}
              {state.error && (
                <p role="alert" className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-2.5">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
                  {state.error}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {result ? (
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={state.submitting}>
                  Cancelar
                </Button>
                <Button
                  onClick={state.submit}
                  disabled={state.submitting || state.problem !== null}
                  title={state.problem ?? undefined}
                >
                  {state.submitting && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
                  {state.submitting ? "Asignando..." : "Asignar suplentes"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HU-08: las mismas advertencias que al asignar a mano; «Continuar» repite con confirmWarnings */}
      <AssignmentWarningsDialog
        warnings={state.warnings.warnings}
        onContinue={state.warnings.continueWithWarnings}
        onCancel={state.warnings.cancel}
      />
    </>
  );
}
