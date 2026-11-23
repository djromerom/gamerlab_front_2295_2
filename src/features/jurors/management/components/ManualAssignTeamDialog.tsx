import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AssignmentWarningsDialog,
  type BlockedItem,
} from "@/features/jurors/assignment/components/AssignmentWarningsDialog";
import { juryManagement } from "@/features/jurors/management/api/juryManagement";
import { useAssignmentWarnings } from "@/features/jurors/assignment/hooks/useAssignmentWarnings";
import { AssignmentWarningsError } from "@/features/jurors/assignment/lib/assignmentWarnings";
import {
  ALL_LEVELS,
  JURORS_PER_TEAM,
  type LevelFilter,
  type LevelTeam,
  distinctLevels,
  filterTeams,
  groupByLevel,
  isOtherLevel,
  jurorLevels,
  levelFilterOptions,
  levelsText,
} from "@/features/jurors/management/lib/manualAssignment";
import {
  type BulkAssignResponse,
  MAX_BULK_TEAMS,
  markVisible,
  mixedLevelsNotice,
  resultTone,
  statusLabel,
  teamDisplayName,
  toggleTeamId,
} from "@/features/jurors/management/lib/bulkAssignment";

interface ManualAssignTeamDialogProps {
  juror: { id: string; firstName: string };
  /** Equipos con menos de 3 jurados; null mientras cargan. */
  teams: LevelTeam[] | null;
  onAssigned: () => void;
}

type JurorTeamsState =
  | { status: "loading" }
  | { status: "ready"; teams: LevelTeam[] }
  | { status: "error" };

const selectClassName = `
  w-full appearance-none rounded-lg
  border border-gray-300
  bg-white dark:bg-transparent
  text-gray-900 dark:text-gray-100
  px-4 py-2 pr-10 text-sm shadow-sm
  transition cursor-pointer
  disabled:cursor-not-allowed disabled:opacity-60
`;
const optionClassName = "bg-white dark:bg-[#120e21]";

function teamDetailText(team: LevelTeam) {
  return [team.teamCode, team.videogame, `${team.jurorCount} de ${JURORS_PER_TEAM} jurados`]
    .filter(Boolean)
    .join(" · ");
}

const TONE_CLASS = {
  success: "border-emerald-500/40 bg-emerald-500/10",
  partial: "border-amber-500/40 bg-amber-500/10",
  none: "border-red-500/40 bg-red-500/10",
} as const;

/** Resultado equipo por equipo de `POST /juror/assignments/bulk` (HU-42). */
function BulkResultView({ result, teams }: { result: BulkAssignResponse; teams: LevelTeam[] }) {
  const tone = resultTone(result.totales);
  const ToneIcon = tone === "success" ? CheckCircle2 : tone === "partial" ? AlertTriangle : AlertCircle;
  const toneIconClass =
    tone === "success" ? "text-emerald-600" : tone === "partial" ? "text-amber-500" : "text-red-600";

  return (
    <div className="space-y-3 text-sm">
      <p role="status" className={`flex items-start gap-2 rounded-md border p-3 ${TONE_CLASS[tone]}`}>
        <ToneIcon className={`mt-0.5 size-4 shrink-0 ${toneIconClass}`} aria-hidden />
        {result.message}
      </p>
      <ul aria-label="Resultado por equipo" className="space-y-2">
        {result.resultados.map((item) => {
          const blocked = item.estado === "BLOCKED";
          const withWarnings = item.estado === "ASSIGNED_WITH_WARNINGS";
          const Icon = blocked ? XCircle : withWarnings ? AlertTriangle : CheckCircle2;
          const iconClass = blocked ? "text-red-600" : withWarnings ? "text-amber-500" : "text-emerald-600";
          return (
            <li key={item.equipoId} className="flex items-start gap-2 rounded-md border p-3">
              <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} aria-hidden />
              <div className="min-w-0 space-y-1">
                <p className="font-medium break-words">{teamDisplayName(item.equipoId, item, teams)}</p>
                <p className="text-xs text-muted-foreground">
                  {statusLabel(item.estado)}
                  {!blocked && typeof item.cantidadJurados === "number" &&
                    ` · ahora tiene ${item.cantidadJurados} ${item.cantidadJurados === 1 ? "jurado" : "jurados"}`}
                </p>
                {blocked && item.bloqueo && <p className="text-xs">{item.bloqueo.message}</p>}
                {item.advertencias.length > 0 && (
                  <ul className="space-y-1">
                    {item.advertencias.map((warning, index) => (
                      <li key={`${warning.code}-${index}`} className="text-xs">
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * «Asignar equipo» de Personal → Jurados. ARK-189: muestra el nivel de cada equipo, permite
 * buscar y filtrar por nivel y avisa de los niveles mezclados. HU-42 (ARK-276): se marcan uno o
 * varios equipos; con uno se usa `POST /juror/assignments` y con varios `POST /juror/assignments/bulk`,
 * que devuelve el resultado equipo por equipo. El servidor sigue decidiendo: si rompe reglas de
 * HU-08 responde 409 y se pide confirmación antes de repetir.
 */
export function ManualAssignTeamDialog({ juror, teams, onAssigned }: ManualAssignTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(ALL_LEVELS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [jurorTeams, setJurorTeams] = useState<JurorTeamsState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkAssignResponse | null>(null);
  const [blockedOnConfirm, setBlockedOnConfirm] = useState<BlockedItem[]>([]);
  const assignmentWarnings = useAssignmentWarnings();

  const loadJurorTeams = async () => {
    setJurorTeams({ status: "loading" });
    try {
      const data = await juryManagement.getTeamsByJuror(juror.id);
      setJurorTeams({ status: "ready", teams: data });
    } catch {
      // P. ej. con un profesor el back responde 400: el diálogo sigue sirviendo sin la indicación
      setJurorTeams({ status: "error" });
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && submitting) return;
    setOpen(next);
    if (next) {
      setQuery("");
      setLevelFilter(ALL_LEVELS);
      setSelectedIds([]);
      setResult(null);
      void loadJurorTeams();
    } else if (result && result.totales.asignados > 0) {
      // Se recarga al cerrar: recargar antes desmontaría la fila y con ella el resultado
      onAssigned();
    }
  };

  const allTeams = teams ?? [];
  const visibleTeams = filterTeams(allTeams, query, levelFilter);
  const groups = groupByLevel(visibleTeams);
  const filterOptions = levelFilterOptions(allTeams);

  const assignedTeams = jurorTeams.status === "ready" ? jurorTeams.teams : [];
  const assignedIds = new Set(assignedTeams.map((team) => team.id));
  const levelsOfJuror = jurorLevels(assignedTeams);

  // Las marcas se conservan al buscar o filtrar; solo cuentan los equipos que siguen en la lista
  const markedTeams = allTeams.filter((team) => selectedIds.includes(team.id) && !assignedIds.has(team.id));
  const markedIds = markedTeams.map((team) => team.id);
  const hiddenMarked = markedTeams.filter((team) => !visibleTeams.includes(team)).length;
  const atLimit = markedIds.length >= MAX_BULK_TEAMS;
  const levelNotice = mixedLevelsNotice(markedTeams, levelsOfJuror);
  const canMarkVisible = visibleTeams.some((team) => !assignedIds.has(team.id) && !markedIds.includes(team.id));

  const toggle = (id: number) => setSelectedIds(toggleTeamId(markedIds, id));

  const assignOne = async (team: LevelTeam, confirmWarnings = false) => {
    setSubmitting(true);
    try {
      const res = await juryManagement.manualAssignment(juror.id, team.id, confirmWarnings);
      if (res.warnings) {
        setBlockedOnConfirm([]);
        assignmentWarnings.askToConfirm(
          new AssignmentWarningsError(res.message, res.warnings),
          () => assignOne(team, true)
        );
        return;
      }
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setOpen(false);
      onAssigned();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "No se pudo asignar el equipo.");
    } finally {
      setSubmitting(false);
    }
  };

  const assignMany = async (teamIds: number[], confirmWarnings = false) => {
    setSubmitting(true);
    try {
      const res = await juryManagement.bulkAssignment(juror.id, teamIds, confirmWarnings);
      // Sin strictNullChecks TS no reduce la unión por `success`; `in` sí la reduce
      if ("result" in res) {
        setResult(res.result);
        return;
      }
      if (res.warnings) {
        setBlockedOnConfirm(
          (res.blocked ?? []).map((item) => ({
            key: item.teamId,
            label: teamDisplayName(item.teamId, { codigo: item.codigo }, allTeams),
            message: item.message,
          }))
        );
        assignmentWarnings.askToConfirm(
          new AssignmentWarningsError(res.message, res.warnings),
          () => assignMany(teamIds, true)
        );
        return;
      }
      toast.error(res.message);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "No se pudieron asignar los equipos.");
    } finally {
      setSubmitting(false);
    }
  };

  const assign = () => {
    if (markedTeams.length === 1) void assignOne(markedTeams[0]);
    else if (markedTeams.length > 1) void assignMany(markedIds);
  };

  const searchId = `assign-search-${juror.id}`;
  const levelId = `assign-level-${juror.id}`;
  const listId = `assign-teams-${juror.id}`;

  const emptyText =
    teams === null
      ? "Cargando equipos..."
      : allTeams.length === 0
        ? "No hay equipos pendientes de jurados"
        : visibleTeams.length === 0
          ? "Ningún equipo coincide con la búsqueda"
          : null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant={"home"} size="sm">
            Asignar equipo
          </Button>
        </DialogTrigger>

        <DialogContent className="flex max-h-[92dvh] flex-col sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Asignar equipos a {juror.firstName}</DialogTitle>
            <DialogDescription>
              {result
                ? "Resultado de la asignación, equipo por equipo."
                : `Marca uno o varios equipos confirmados de la edición activa que aún no tienen ${JURORS_PER_TEAM} jurados.`}
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BulkResultView result={result} teams={allTeams} />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {jurorTeams.status === "loading" && "Consultando los equipos que ya tiene el jurado..."}
                {jurorTeams.status === "error" && "No se pudieron consultar los niveles que ya tiene este jurado."}
                {jurorTeams.status === "ready" &&
                  (assignedTeams.length === 0
                    ? "Este jurado aún no tiene equipos asignados."
                    : `Este jurado ya tiene: ${levelsText(distinctLevels(assignedTeams))}`)}
              </p>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={searchId}>Buscar</Label>
                  <Input
                    id={searchId}
                    placeholder="Equipo, videojuego o código..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={teams === null}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={levelId}>Nivel</Label>
                  <div className="relative">
                    <select
                      id={levelId}
                      className={selectClassName}
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      disabled={teams === null}
                    >
                      <option value={ALL_LEVELS} className={optionClassName}>
                        Todos los niveles
                      </option>
                      {filterOptions.map((option) => (
                        <option key={option.value} value={option.value} className={optionClassName}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span id={listId} className="text-sm font-medium">
                    Equipos
                  </span>
                  {teams !== null && (
                    <span className="text-xs text-muted-foreground">
                      {visibleTeams.length} de {allTeams.length} equipos
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground" aria-live="polite">
                    {markedIds.length === 1 ? "1 equipo marcado" : `${markedIds.length} equipos marcados`}
                    {hiddenMarked > 0 && ` (${hiddenMarked} fuera de la búsqueda)`}
                    {atLimit && ` · máximo ${MAX_BULK_TEAMS} por vez`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds(markVisible(markedIds, visibleTeams, assignedIds))}
                      disabled={!canMarkVisible || atLimit || submitting}
                    >
                      Marcar visibles
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      disabled={markedIds.length === 0 || submitting}
                    >
                      Quitar marcas
                    </Button>
                  </div>
                </div>

                {/* En el celular solo se desplaza el diálogo; desde sm la lista tiene su propia barra */}
                <div
                  role="group"
                  aria-labelledby={listId}
                  className="min-h-24 rounded-md border sm:max-h-72 sm:overflow-y-auto"
                >
                  {emptyText ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">{emptyText}</p>
                  ) : (
                    groups.map((group) => (
                      <div key={group.label} role="group" aria-label={group.label}>
                        <p className="sticky top-0 z-10 border-b bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {group.label}
                        </p>
                        <ul>
                          {group.teams.map((team) => {
                            const alreadyAssigned = assignedIds.has(team.id);
                            const checked = markedIds.includes(team.id);
                            const disabled = alreadyAssigned || submitting || (atLimit && !checked);
                            const otherLevel = !alreadyAssigned && isOtherLevel(team, levelsOfJuror);
                            return (
                              <li key={team.id} className="border-b last:border-b-0">
                                <label
                                  className={`flex items-start gap-3 p-2.5 text-sm ${
                                    disabled ? "opacity-50" : "cursor-pointer hover:bg-accent"
                                  }`}
                                >
                                  <span className="mt-0.5 flex">
                                    <Checkbox
                                      checked={checked}
                                      disabled={disabled}
                                      onChange={() => toggle(team.id)}
                                      aria-label={team.name}
                                    />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{team.name}</span>
                                    <span className="block text-xs text-muted-foreground">
                                      {teamDetailText(team)}
                                      {alreadyAssigned && " · ya asignado"}
                                      {otherLevel && " · ⚠ otro nivel"}
                                    </span>
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {levelNotice && (
                <div
                  role="alert"
                  className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>{levelNotice}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {result ? (
              <Button variant={"home"} onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
            ) : (
              <Button
                variant={"home"}
                onClick={assign}
                disabled={markedTeams.length === 0 || submitting}
                className="w-full"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {markedTeams.length > 1 ? `Asignar ${markedTeams.length} equipos` : "Asignar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignmentWarningsDialog
        warnings={assignmentWarnings.warnings}
        blocked={blockedOnConfirm}
        onContinue={assignmentWarnings.continueWithWarnings}
        onCancel={assignmentWarnings.cancel}
      />
    </>
  );
}
