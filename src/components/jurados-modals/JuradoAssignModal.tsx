import { useEffect } from "react";
import {
  UserPlus,
  X,
} from "lucide-react";
import type {
  Jurado,
  Team,
} from "@/types/jurados";
import {
  getInitials,
  formatDate,
  getJurorTypeLabel,
  getJurorCategoryLabel,
  isColegioTeam,
} from "@/types/jurados";

interface JuradoAssignModalProps {
  selectedTeam: Team;
  juradosDisponiblesParaModal: Jurado[];
  reassignContext: {
    teamId: number;
    currentJurorId: string;
    currentJurorName: string;
  } | null;
  isSubmitting: boolean;
  onClose: () => void;
  onAssign: (teamId: number, jurado: Jurado) => void;
  onReassign: (teamId: number, currentJurorId: string, newJuror: Jurado) => void;
}

export function JuradoAssignModal({
  selectedTeam,
  juradosDisponiblesParaModal,
  reassignContext,
  isSubmitting,
  onClose,
  onAssign,
  onReassign,
}: JuradoAssignModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg md:text-xl font-medium">
              {reassignContext ? "Reasignar Jurado" : "Asignar Jurado"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Equipo: {selectedTeam.name} · Videojuego: {selectedTeam.game}
            </p>
            {reassignContext && (
              <p className="text-xs text-muted-foreground mt-1">
                Reemplazando a: {reassignContext.currentJurorName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-medium">{selectedTeam.name}</div>
            <div className="text-sm text-muted-foreground">
              {selectedTeam.jurados.length}/{selectedTeam.requiredJurados} jurados asignados
            </div>
            {isColegioTeam(selectedTeam) && (
              <div className="mt-2 text-xs text-blue-500">
                Equipo de colegio: los jurados Junior no aparecerán como opción disponible.
              </div>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {juradosDisponiblesParaModal.map((jurado) => (
              <div
                key={jurado.id}
                className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
              >
                <div className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center bg-muted text-sm font-medium flex-shrink-0">
                  {getInitials(jurado.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{jurado.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {jurado.email}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tipo: {getJurorTypeLabel(jurado.tipo)} · Categoría: {getJurorCategoryLabel(jurado.jurorCategory)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Último ingreso: {formatDate(jurado.lastSignInAt)}
                  </div>
                </div>

                <button
                  onClick={() =>
                    reassignContext
                      ? void onReassign(
                        selectedTeam.id,
                        reassignContext.currentJurorId,
                        jurado
                      )
                      : void onAssign(selectedTeam.id, jurado)
                  }
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {reassignContext ? "Reasignar" : "Asignar"}
                </button>
              </div>
            ))}

            {juradosDisponiblesParaModal.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                No hay jurados disponibles para asignar. Recuerda que deben tener categoría JUNIOR/SENIOR.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
