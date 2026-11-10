import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssignmentWarningsDialog } from "@/components/jurados-modals/AssignmentWarningsDialog";
import { juryManagement } from "@/hooks/juryManagement";
import { useAssignmentWarnings } from "@/hooks/useAssignmentWarnings";
import { AssignmentWarningsError } from "@/lib/assignmentWarnings";
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
} from "./manualAssignment";

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

function teamOptionText(team: LevelTeam, otherLevel: boolean, alreadyAssigned: boolean) {
  const parts = [team.name, team.levelLabel, `${team.jurorCount} de ${JURORS_PER_TEAM} jurados`];
  if (alreadyAssigned) parts.push("ya asignado");
  else if (otherLevel) parts.push("⚠ otro nivel");
  return parts.join(" · ");
}

/**
 * ARK-189: «Asignar equipo» de Personal → Jurados. Muestra el nivel de cada equipo,
 * permite buscar y filtrar por nivel y avisa cuando el equipo es de un nivel distinto
 * a los que ya tiene el jurado. El servidor sigue decidiendo: si la asignación rompe
 * reglas de HU-08, responde 409 y se pide confirmación antes de repetirla.
 */
export function ManualAssignTeamDialog({ juror, teams, onAssigned }: ManualAssignTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(ALL_LEVELS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [jurorTeams, setJurorTeams] = useState<JurorTeamsState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
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
    setOpen(next);
    if (next) {
      setQuery("");
      setLevelFilter(ALL_LEVELS);
      setSelectedId(null);
      void loadJurorTeams();
    }
  };

  const allTeams = teams ?? [];
  const visibleTeams = filterTeams(allTeams, query, levelFilter);
  const groups = groupByLevel(visibleTeams);
  const filterOptions = levelFilterOptions(allTeams);

  const assignedTeams = jurorTeams.status === "ready" ? jurorTeams.teams : [];
  const assignedIds = new Set(assignedTeams.map((team) => team.id));
  const levelsOfJuror = jurorLevels(assignedTeams);

  // Si el buscador o el filtro esconden el equipo elegido, deja de estar seleccionado
  const selectedTeam = visibleTeams.find((team) => team.id === selectedId) ?? null;
  const selectedIsOtherLevel = selectedTeam ? isOtherLevel(selectedTeam, levelsOfJuror) : false;

  const assign = async (confirmWarnings = false) => {
    if (!selectedTeam) return;
    setSubmitting(true);
    try {
      const res = await juryManagement.manualAssignment(juror.id, selectedTeam.id, confirmWarnings);
      if (res.warnings) {
        assignmentWarnings.askToConfirm(
          new AssignmentWarningsError(res.message, res.warnings),
          () => assign(true)
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

  const searchId = `assign-search-${juror.id}`;
  const levelId = `assign-level-${juror.id}`;
  const teamId = `assign-team-${juror.id}`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant={"home"} size="sm">
            Asignar equipo
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar equipo a {juror.firstName}</DialogTitle>
            <DialogDescription>
              Equipos confirmados de la edición activa que aún no tienen {JURORS_PER_TEAM} jurados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={teamId}>Equipo</Label>
                {teams !== null && (
                  <span className="text-xs text-muted-foreground">
                    {visibleTeams.length} de {allTeams.length} equipos
                  </span>
                )}
              </div>
              <div className="flex w-full relative">
                <select
                  id={teamId}
                  className={selectClassName}
                  value={selectedTeam ? String(selectedTeam.id) : ""}
                  onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                  disabled={teams === null || visibleTeams.length === 0}
                >
                  <option value="" disabled className={optionClassName}>
                    {teams === null
                      ? "Cargando equipos..."
                      : allTeams.length === 0
                        ? "No hay equipos pendientes de jurados"
                        : visibleTeams.length === 0
                          ? "Ningún equipo coincide con la búsqueda"
                          : "Seleccione un equipo..."}
                  </option>
                  {groups.map((group) => (
                    <optgroup key={group.label} label={group.label} className={optionClassName}>
                      {group.teams.map((team) => {
                        const alreadyAssigned = assignedIds.has(team.id);
                        return (
                          <option
                            key={team.id}
                            value={String(team.id)}
                            disabled={alreadyAssigned}
                            className={optionClassName}
                          >
                            {teamOptionText(team, isOtherLevel(team, levelsOfJuror), alreadyAssigned)}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                  ▼
                </div>
              </div>
            </div>

            {selectedTeam && selectedIsOtherLevel && (
              <div
                role="alert"
                className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  «{selectedTeam.name}» es de {selectedTeam.levelLabel} y el jurado ya tiene{" "}
                  {levelsText(levelsOfJuror)}. Cada jurado debería evaluar grupos de un solo nivel;
                  al asignar se pedirá confirmación.
                </span>
              </div>
            )}

            <Input
              placeholder="Nombre del videojuego"
              aria-label="Videojuego del equipo"
              disabled
              value={selectedTeam?.videogame ?? ""}
            />
            <Button
              variant={"home"}
              onClick={() => void assign()}
              disabled={!selectedTeam || submitting}
              className="w-full"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AssignmentWarningsDialog
        warnings={assignmentWarnings.warnings}
        onContinue={assignmentWarnings.continueWithWarnings}
        onCancel={assignmentWarnings.cancel}
      />
    </>
  );
}
