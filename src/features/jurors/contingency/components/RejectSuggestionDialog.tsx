import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MAX_REJECT_REASON, type GroupSuggestion } from "@/features/jurors/contingency/api/contingency";

interface RejectSuggestionDialogProps {
  // null = cerrado
  group: GroupSuggestion | null;
  isSaving: boolean;
  error: string | null;
  onConfirm: (substituteIds: string[], reason: string) => void;
  onCancel: () => void;
}

/** Rechazar toda la sugerencia del grupo o solo algunos suplentes, con un motivo opcional. */
export function RejectSuggestionDialog({ group, isSaving, error, onConfirm, onCancel }: RejectSuggestionDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setSelected(group?.sugeridos.map((substitute) => substitute.id) ?? []);
    setReason("");
  }, [group]);

  const toggle = (id: string, checked: boolean) =>
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));

  const all = group?.sugeridos.length ?? 0;

  return (
    <Dialog open={group !== null} onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar sugerencia</DialogTitle>
          <DialogDescription>
            {group ? `${group.codigo} · ${group.nombre}. ` : ""}
            No cambia asignaciones. Quedará registro de quién, cuándo y por qué; los rechazados no se
            vuelven a sugerir para este grupo, pero siguen en «Elegir otro».
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            // Todos marcados = rechazar toda la sugerencia actual (sin substituteIds)
            onConfirm(selected.length === all ? [] : selected, reason);
          }}
        >
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Suplentes que rechazas</legend>
            {group?.sugeridos.map((substitute) => (
              <label key={substitute.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Checkbox
                  checked={selected.includes(substitute.id)}
                  onChange={(event) => toggle(substitute.id, event.target.checked)}
                  aria-label={`Rechazar a ${substitute.nombre}`}
                />
                {substitute.nombre}
              </label>
            ))}
          </fieldset>

          <label className="block text-sm">
            Motivo (opcional)
            <Textarea
              className="mt-1"
              value={reason}
              maxLength={MAX_REJECT_REASON}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ej.: prefiero a un profesor del área"
            />
            <span className="mt-1 block text-right text-xs text-muted-foreground">
              {reason.length}/{MAX_REJECT_REASON}
            </span>
          </label>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={isSaving || selected.length === 0}>
              {isSaving ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
