import { X } from "lucide-react";
import type { Team } from "@/types/jurados";
import {
  getAssignmentKey,
  getJurorCategoryLabel,
  getJurorTypeLabel,
} from "@/types/jurados";

interface AllTeamsModalProps {
  teams: Team[];
  onClose: () => void;
}

export function AllTeamsModal({ teams, onClose }: AllTeamsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg md:text-xl font-medium">Todos los equipos y jurados asignados</h2>
            <p className="text-sm text-muted-foreground">Vista completa de equipos cargados desde la base de datos.</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 md:p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 border-b border-border pb-3 mb-3">
                <div>
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-muted-foreground">Videojuego: {team.game}</div>
                  <div className="text-xs text-muted-foreground">Líder: {team.leaderName}</div>
                </div>
                <div className="rounded-full border px-3 py-1 text-xs w-fit">
                  {team.jurados.length}/{team.requiredJurados} jurados
                </div>
              </div>

              {team.jurados.length === 0 ? (
                <div className="text-sm text-muted-foreground">Este equipo no tiene jurados asignados.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {team.jurados.map((jurado) => (
                    <div key={getAssignmentKey(team.id, jurado.id)} className="rounded-xl border border-border p-3">
                      <div className="font-medium text-sm">{jurado.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{jurado.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getJurorCategoryLabel(jurado.jurorCategory)} · {getJurorTypeLabel(jurado.tipo)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
