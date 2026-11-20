import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GroupSuggestion, RankedSubstitute } from "@/features/jurors/contingency/api/contingency";
import { SubstituteDetails } from "@/features/jurors/contingency/components/SubstituteDetails";

interface ChooseSubstituteDialogProps {
  // null = cerrado
  group: GroupSuggestion | null;
  isSaving: boolean;
  error: string | null;
  onConfirm: (substituteId: string) => void;
  onCancel: () => void;
}

/**
 * Asignación manual: el admin elige un suplente de las alternativas (o uno de los sugeridos) y se
 * guarda con la misma ruta de aceptar. Las alternativas vienen ya ordenadas por el back.
 */
export function ChooseSubstituteDialog({ group, isSaving, error, onConfirm, onCancel }: ChooseSubstituteDialogProps) {
  const [selected, setSelected] = useState("");

  useEffect(() => setSelected(""), [group]);

  const options: Array<{ title: string; items: RankedSubstitute[] }> = group
    ? [
        { title: "Alternativas", items: group.alternativas },
        { title: "Sugeridos", items: group.sugeridos },
      ].filter((section) => section.items.length > 0)
    : [];

  return (
    <Dialog open={group !== null} onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Elegir otro suplente</DialogTitle>
          <DialogDescription>
            {group ? `${group.codigo} · ${group.nombre}. ` : ""}
            Se suma al grupo; nadie pierde grupos.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (selected) onConfirm(selected);
          }}
        >
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay suplentes disponibles para este grupo.</p>
          ) : (
            options.map((section) => (
              <fieldset key={section.title} className="space-y-2">
                <legend className="mb-1 text-sm font-medium">{section.title}</legend>
                {section.items.map((substitute) => (
                  <label
                    key={substitute.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="contingency-substitute"
                      value={substitute.id}
                      checked={selected === substitute.id}
                      onChange={() => setSelected(substitute.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{substitute.nombre}</span>
                      <SubstituteDetails substitute={substitute} />
                    </span>
                  </label>
                ))}
              </fieldset>
            ))
          )}

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" disabled={isSaving || !selected}>
              {isSaving ? "Asignando..." : "Asignar al grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
