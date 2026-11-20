import { X } from "lucide-react";
import type { AssignmentAuditLog } from "@/features/jurors/types/jurors";
import { normalizeAuditAction, formatDate } from "@/features/jurors/types/jurors";
import {
  AUDIT_UNAVAILABLE,
  auditNoteText,
  auditPersonLabel,
  auditTeamLabel,
} from "@/features/jurors/assignment/lib/auditLog";

interface AuditModalProps {
  auditLogs: AssignmentAuditLog[];
  /** ARK-262: total de registros del historial (los cargados pueden ser menos). */
  totalItems: number;
  loadingMore: boolean;
  onLoadMore: () => void;
  onClose: () => void;
  /** Nombre que ya conoce la pantalla (listas cargadas), o null si no lo conoce. */
  getJurorNameById: (id?: string | null) => string | null;
  getTeamNameById: (id?: number | string | null) => string | null;
  getActorNameById: (id?: string | null) => string | null;
}

export function AuditModal({
  auditLogs,
  totalItems,
  loadingMore,
  onLoadMore,
  onClose,
  getJurorNameById,
  getTeamNameById,
  getActorNameById,
}: AuditModalProps) {
  const total = Math.max(totalItems, auditLogs.length);
  const hasMore = auditLogs.length < total;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-modal-title"
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h2 id="audit-modal-title" className="text-lg md:text-xl font-medium">
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
            auditLogs.map((log, index) => {
              const note = auditNoteText(log);
              return (
                <div
                  key={log.id ?? index}
                  className="rounded-xl border border-border bg-card p-4 text-sm"
                >
                  <div className="font-medium">
                    Acción: {normalizeAuditAction(String(log.action ?? ""))}
                  </div>

                  <div className="text-muted-foreground mt-1 break-words">
                    Equipo: {auditTeamLabel(log, getTeamNameById(log.teamId))}
                  </div>

                  <div className="text-muted-foreground break-words">
                    Jurado:{" "}
                    {auditPersonLabel(
                      log.jurorId ?? log.newJurorId,
                      log.jurorName ?? log.newJurorName,
                      getJurorNameById(log.jurorId ?? log.newJurorId),
                      AUDIT_UNAVAILABLE.juror
                    )}
                  </div>

                  {log.previousJurorId && (
                    <div className="text-muted-foreground break-words">
                      Jurado anterior:{" "}
                      {auditPersonLabel(
                        log.previousJurorId,
                        log.previousJurorName,
                        getJurorNameById(log.previousJurorId),
                        AUDIT_UNAVAILABLE.juror
                      )}
                    </div>
                  )}

                  {log.newJurorId && (
                    <div className="text-muted-foreground break-words">
                      Jurado nuevo:{" "}
                      {auditPersonLabel(
                        log.newJurorId,
                        log.newJurorName,
                        getJurorNameById(log.newJurorId),
                        AUDIT_UNAVAILABLE.juror
                      )}
                    </div>
                  )}

                  <div className="text-muted-foreground break-words">
                    Usuario que realizó el cambio:{" "}
                    {auditPersonLabel(
                      log.actorUserId,
                      log.actorName,
                      getActorNameById(log.actorUserId),
                      AUDIT_UNAVAILABLE.actor
                    )}
                  </div>

                  <div className="text-muted-foreground">
                    Fecha: {formatDate(String(log.createdAt ?? log.creado_en ?? log.timestamp ?? ""))}
                  </div>

                  {note && (
                    <div className="text-muted-foreground mt-1 break-words">
                      Nota: {note}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {auditLogs.length > 0 && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Mostrando {auditLogs.length} de {total} registros
              </p>
              {hasMore && (
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-border bg-card hover:bg-accent px-4 py-2 text-sm font-medium text-foreground transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
