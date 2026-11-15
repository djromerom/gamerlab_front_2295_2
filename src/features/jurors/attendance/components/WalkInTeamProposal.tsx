import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { SuggestedTeam, TeamSuggestion, WalkInAssignmentResult } from "@/features/jurors/attendance/api/walkInJurors";
import { MAX_ASSIGNABLE_TEAMS } from "@/features/jurors/attendance/api/walkInJurors";
import { basisText, missingText, plural } from "@/features/jurors/attendance/lib/walkInJuror";

interface WalkInTeamProposalProps {
  suggestion: TeamSuggestion;
  options: SuggestedTeam[];
  selected: number[];
  editing: boolean;
  onToggle: (id: number) => void;
}

function TeamLine({ team }: { team: SuggestedTeam }) {
  return (
    <span className="min-w-0">
      <span className="block font-medium">
        {team.codigo} · {team.nombre}
      </span>
      <span className="block text-xs text-muted-foreground">
        {missingText(team)}
        {team.videojuego && ` · ${team.videojuego}`}
      </span>
    </span>
  );
}

/** Lista propuesta (solo lectura) o, al editar, todos los grupos con faltantes del nivel con casillas. */
export function WalkInTeamProposal({ suggestion, options, selected, editing, onToggle }: WalkInTeamProposalProps) {
  if (suggestion.reason === "NO_SHORTAGE" || suggestion.teams.length === 0) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        No hay grupos con faltantes. No se asignó nada: el jurado queda como suplente presente sin grupos.
      </p>
    );
  }

  const full = selected.length >= MAX_ASSIGNABLE_TEAMS;
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-md border bg-muted/40 p-3">
        <p className="font-medium">
          {suggestion.levelLabel ?? `Nivel ${suggestion.level}`}: el nivel con más jurados faltantes
        </p>
        <p className="text-xs text-muted-foreground">{basisText(suggestion.basis)}</p>
      </div>

      {editing ? (
        <fieldset className="space-y-2">
          <legend className="mb-2 flex w-full justify-between font-medium">
            <span>Grupos con faltantes del nivel</span>
            <span className="text-xs font-normal text-muted-foreground">{plural(selected.length, "elegido", "elegidos")}</span>
          </legend>
          <ul aria-label="Grupos con faltantes del nivel" className="rounded-md border">
            {options.map((team) => {
              const checked = selected.includes(team.id);
              const disabled = !checked && full;
              return (
                <li key={team.id} className="border-b last:border-b-0">
                  <label className={`flex items-start gap-3 p-2.5 ${disabled ? "opacity-50" : "cursor-pointer hover:bg-accent"}`}>
                    <span className="mt-0.5 flex">
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(team.id)}
                        aria-label={`${team.codigo} ${team.nombre}`}
                      />
                    </span>
                    <TeamLine team={team} />
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : (
        <ul aria-label="Grupos propuestos" className="rounded-md border">
          {suggestion.teams.map((team) => (
            <li key={team.id} className="border-b p-2.5 last:border-b-0">
              <TeamLine team={team} />
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Se suma a los jurados que ya tiene cada grupo: nadie pierde grupos.</p>
    </div>
  );
}

export function WalkInAssignmentResultView({ result }: { result: WalkInAssignmentResult }) {
  return (
    <div role="status" className="space-y-3 text-sm">
      <p className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        {result.message}
      </p>
      {result.equiposAgregados.length > 0 && (
        <div>
          <p className="font-medium">{plural(result.equiposAgregados.length, "grupo nuevo", "grupos nuevos")}</p>
          <ul className="mt-1 list-inside list-disc text-xs">
            {result.equiposAgregados.map((team) => (
              <li key={team.id}>
                {team.codigo} · {team.nombre}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.equiposYaAsignados.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Ya tenía: {result.equiposYaAsignados.map((team) => team.codigo).join(", ")}.
        </p>
      )}
      {result.equiposAgregados.length > 0 && (
        <p className="text-xs text-muted-foreground">{result.jurado.nombre} recibe el aviso «Te asignaron grupos».</p>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-2.5 text-sm">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
      {message}
    </p>
  );
}

export function LoadingLine({ text }: { text: string }) {
  return (
    <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {text}
    </p>
  );
}
