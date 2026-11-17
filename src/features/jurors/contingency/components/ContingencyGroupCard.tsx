import { AlertTriangle, Check, UserSearch, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GroupJurorStatus, GroupSuggestion } from "@/features/jurors/contingency/api/contingency";
import { SubstituteDetails } from "@/features/jurors/contingency/components/SubstituteDetails";
import {
  categoryLabel,
  jurorStatusLabel,
  levelLabel,
  plural,
} from "@/features/jurors/contingency/lib/contingency";

const statusClass: Record<GroupJurorStatus, string> = {
  PRESENT: "bg-green-500/15 text-green-700 dark:text-green-400",
  ABSENT: "bg-red-500/15 text-red-700 dark:text-red-400",
  LEFT: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

interface ContingencyGroupCardProps {
  group: GroupSuggestion;
  minimum: number;
  disabled: boolean;
  onAccept: (group: GroupSuggestion) => void;
  onReject: (group: GroupSuggestion) => void;
  onChoose: (group: GroupSuggestion) => void;
}

export function ContingencyGroupCard({ group, minimum, disabled, onAccept, onReject, onChoose }: ContingencyGroupCardProps) {
  const hasSuggestion = group.sugeridos.length > 0;
  const canChoose = group.alternativas.length > 0 || hasSuggestion;

  return (
    <article aria-label={`Grupo ${group.codigo}`} className="rounded-lg border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium">{group.nombre}</h3>
          <p className="text-xs text-muted-foreground">
            {group.codigo}
            {group.videojuego ? ` · ${group.videojuego}` : ""} · {levelLabel(group.nivel)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">
            Faltan {group.faltantes}
          </div>
          <div className="text-xs text-muted-foreground">
            Cuentan {group.juradosContados} de {minimum}
          </div>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Jurados del grupo</h4>
          {group.jurados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin jurados asignados.</p>
          ) : (
            <ul className="space-y-1">
              {group.jurados.map((juror) => (
                <li key={juror.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-muted/30 px-2 py-1.5 text-sm">
                  <span className={juror.cuenta ? "" : "text-muted-foreground line-through decoration-muted-foreground/60"}>
                    {juror.nombre}
                    <span className="ml-1 text-xs text-muted-foreground no-underline">· {categoryLabel(juror.categoria)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    {juror.evaluo && <Badge variant="outline">Ya evaluó</Badge>}
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusClass[juror.estado]}`}>
                      {jurorStatusLabel[juror.estado]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Suplentes sugeridos</h4>
          {hasSuggestion ? (
            <ul className="space-y-1">
              {group.sugeridos.map((substitute) => (
                <li key={substitute.id} className="rounded border border-primary/20 bg-primary/5 px-2 py-1.5 text-sm">
                  <div className="font-medium">{substitute.nombre}</div>
                  <SubstituteDetails substitute={substitute} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {group.alternativas.length > 0
                ? "No hay sugerencia para este grupo. Usa «Elegir otro» para asignar a mano."
                : "No hay suplentes disponibles para este grupo."}
            </p>
          )}
          {group.sinCubrir > 0 && (
            <p className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-700 dark:text-red-400">
              {plural(group.sinCubrir, "faltante")} sin suplente que lo cubra.
            </p>
          )}
        </section>
      </div>

      {group.advertencias.length > 0 && (
        <ul aria-label={`Advertencias de ${group.codigo}`} className="mt-3 space-y-1">
          {group.advertencias.map((warning, index) => (
            <li key={`${warning.code}-${index}`} className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              {warning.message}
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled || !canChoose} onClick={() => onChoose(group)}>
          <UserSearch /> Elegir otro
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled || !hasSuggestion} onClick={() => onReject(group)}>
          <X /> Rechazar
        </Button>
        <Button type="button" size="sm" disabled={disabled || !hasSuggestion} onClick={() => onAccept(group)}>
          <Check /> Aceptar
        </Button>
      </footer>
    </article>
  );
}
