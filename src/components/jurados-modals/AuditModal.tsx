import { X } from "lucide-react";
import type { AssignmentAuditLog } from "@/types/jurados";
import { normalizeAuditAction, formatDate } from "@/types/jurados";

interface AuditModalProps {
  auditLogs: AssignmentAuditLog[];
  onClose: () => void;
  getJurorNameById: (id?: string | null) => string;
  getTeamNameById: (id?: number | string | null) => string;
  getActorNameById: (id?: string | null) => string;
}

export function AuditModal({
  auditLogs,
  onClose,
  getJurorNameById,
  getTeamNameById,
  getActorNameById,
}: AuditModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg md:text-xl font-medium">
              Historial de cambios manuales
            </h2>
            <p className="text-sm text-muted-foreground">
              Registro de asignaciones, desasignaciones y reasignaciones.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {auditLogs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No hay registros de auditoría.
            </div>
          ) : (
            auditLogs.map((log, index) => (
              <div
                key={log.id ?? index}
                className="rounded-xl border border-border bg-card p-4 text-sm"
              >
                <div className="font-medium">
                  Acción: {normalizeAuditAction(String(log.action ?? ""))}
                </div>

                <div className="text-muted-foreground mt-1">
                  Equipo: {getTeamNameById(log.teamId)}
                </div>

                <div className="text-muted-foreground">
                  Jurado: {getJurorNameById(log.jurorId ?? log.newJurorId)}
                </div>

                {log.previousJurorId && (
                  <div className="text-muted-foreground">
                    Jurado anterior: {getJurorNameById(log.previousJurorId)}
                  </div>
                )}

                {log.newJurorId && (
                  <div className="text-muted-foreground">
                    Jurado nuevo: {getJurorNameById(log.newJurorId)}
                  </div>
                )}

                <div className="text-muted-foreground">
                  Usuario que realizó el cambio: {getActorNameById(log.actorUserId)}
                </div>

                <div className="text-muted-foreground">
                  Fecha: {formatDate(String(log.createdAt ?? log.creado_en ?? log.timestamp ?? ""))}
                </div>

                {log.notes && (
                  <div className="text-muted-foreground mt-1">
                    Nota: {String(log.notes)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
