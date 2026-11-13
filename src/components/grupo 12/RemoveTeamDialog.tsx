import { useState } from "react";
import { BadgeXIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AssignmentWarningsDialog } from "@/components/jurados-modals/AssignmentWarningsDialog";
import { juryManagement } from "@/hooks/juryManagement";
import { useAssignmentWarnings } from "@/hooks/useAssignmentWarnings";
import { AssignmentWarningsError } from "@/lib/assignmentWarnings";
import type { LevelTeam } from "./manualAssignment";
import type { JurorRowData } from "./utils";

interface RemoveTeamDialogProps {
  juror: JurorRowData;
  /** Después de quitar el equipo (la tabla recarga sus datos). */
  onRemoved: () => void;
}

/**
 * «Quitar un equipo» de Personal → Jurados, para un jurado o un profesor jurado (BG-44).
 * Si quitar rompe una regla de HU-08 (por ejemplo, el grupo queda con menos de 3 jurados),
 * el servidor responde 409 sin quitar nada: se muestran las advertencias y, si el
 * administrador continúa, se repite la petición con `confirmWarnings: true` (ARK-206).
 */
export function RemoveTeamDialog({ juror, onRemoved }: RemoveTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<LevelTeam[]>([]);
  const [selected, setSelected] = useState<LevelTeam | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const assignmentWarnings = useAssignmentWarnings();

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setTeams([]);
    setSelected(null);
    try {
      setTeams(await juryManagement.getTeamsByJuror(juror.id));
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : "No se pudieron cargar los equipos del jurado.",
      );
    }
  };

  const remove = async (confirmWarnings = false) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await juryManagement.deleteAnAssignment(juror.id, selected.id, confirmWarnings);
      if (res.warnings) {
        assignmentWarnings.askToConfirm(new AssignmentWarningsError(res.message, res.warnings), () =>
          remove(true),
        );
        return;
      }
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setOpen(false);
      onRemoved();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "No se pudo quitar el equipo.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectId = `remove-team-${juror.id}`;

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => void handleOpenChange(next)}>
        <DialogTrigger asChild>
          <Button variant={"destructive"} size="sm" aria-label={`Quitar un equipo a ${juror.firstName}`}>
            <BadgeXIcon />
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quitar equipo a {juror.firstName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div className="flex w-full relative">
              <select
                id={selectId}
                aria-label="Equipo a quitar"
                className="
                  w-full appearance-none rounded-lg
                  border border-gray-300
                  bg-white dark:bg-transparent
                  text-gray-900 dark:text-gray-100
                  px-4 py-2 pr-10 text-sm shadow-sm
                  transition
                  cursor-pointer
                "
                value={selected ? String(selected.id) : ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSelected(teams.find((team) => team.id === value) ?? null);
                }}
              >
                <option value="" disabled className="bg-white dark:bg-[#120e21]">
                  Seleccione un equipo...
                </option>
                {teams.map((team) => (
                  <option key={team.id} value={String(team.id)} className="bg-white dark:bg-[#120e21]">
                    {`${team.name} · ${team.levelLabel}`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                ▼
              </div>
            </div>

            <div className="flex justify-between items-center w-full">
              <Input placeholder="Nombre del videojuego" disabled value={selected?.videogame || ""} />
            </div>
            <Button
              variant={"destructive"}
              disabled={!selected || submitting}
              onClick={() => void remove()}
              className="w-full"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Quitar
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
