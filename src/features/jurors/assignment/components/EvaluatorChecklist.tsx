import { useState } from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { EditionEvaluator } from "@/features/jurors/assignment/api/bulkSubstitutes";
import { fullName, matchesSearch } from "@/features/jurors/assignment/lib/bulkSubstitutes";

interface EvaluatorChecklistProps {
  title: string;
  /** Nombre accesible de la lista y del buscador. */
  label: string;
  items: EditionEvaluator[];
  selected: string[];
  onToggle: (id: string) => void;
  /** Texto bajo el nombre (rol, categoría, grupos). */
  describe: (e: EditionEvaluator) => string;
  /** Ids que no se pueden marcar en esta lista, con el motivo. */
  disabled?: Record<string, string>;
  emptyText: string;
}

/** Lista con buscador y casillas para elegir jurados o suplentes (HU-09). */
export function EvaluatorChecklist({ title, label, items, selected, onToggle, describe, disabled = {}, emptyText }: EvaluatorChecklistProps) {
  const [term, setTerm] = useState("");
  const visible = items.filter((e) => matchesSearch(e, term));

  return (
    <fieldset className="flex min-h-0 min-w-0 flex-col gap-2">
      <legend className="mb-2 flex w-full items-center justify-between text-sm font-medium">
        <span>{title}</span>
        <span className="text-xs font-normal text-muted-foreground">{selected.length} elegidos</span>
      </legend>
      <div className="flex h-9 items-center gap-2 rounded-md border px-2">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          aria-label={`Buscar en ${label}`}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar por nombre o correo"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <ul aria-label={label} className="max-h-56 min-h-24 overflow-y-auto rounded-md border sm:max-h-72">
        {items.length === 0 ? (
          <li className="p-3 text-center text-sm text-muted-foreground">{emptyText}</li>
        ) : visible.length === 0 ? (
          <li className="p-3 text-center text-sm text-muted-foreground">Nadie coincide con la búsqueda.</li>
        ) : (
          visible.map((e) => {
            const reason = disabled[e.id];
            return (
              <li key={e.id} className="border-b last:border-b-0">
                <label className={`flex items-start gap-3 p-2.5 text-sm ${reason ? "opacity-50" : "cursor-pointer hover:bg-accent"}`}>
                  <span className="mt-0.5 flex">
                    <Checkbox
                      checked={selected.includes(e.id)}
                      disabled={Boolean(reason)}
                      onChange={() => onToggle(e.id)}
                      aria-label={fullName(e)}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{fullName(e)}</span>
                    <span className="block text-xs text-muted-foreground">{reason ?? describe(e)}</span>
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>
    </fieldset>
  );
}
