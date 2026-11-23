import type { ReactNode } from "react";
import type { AlertJuror } from "@/features/jurors/presence/api/absenceAlert";

/** «N2-AYP-07 · N2», o solo el código si no tiene nivel. */
const groupLabel = (group: { teamCode: string; level: string | null }) =>
  group.level ? `${group.teamCode} · ${group.level}` : group.teamCode;

/**
 * HU-44 (ARK-294): un jurado de la alerta con sus grupos (código y nivel) y cuántos le faltan por
 * calificar. Si el back aún no manda los grupos, se ve solo el nombre, como antes.
 */
export function AbsentJurorItem({ juror, children }: { juror: AlertJuror; children?: ReactNode }) {
  const groups = juror.groups;
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded px-2 py-1.5 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <div>{juror.name}{juror.isProfessor ? " · Profesor NRC" : ""}</div>
        {groups && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {groups.length === 0 ? (
              "Sin grupos asignados"
            ) : (
              <>
                <span className="break-words">Grupos: {groups.map(groupLabel).join(", ")}</span>
                {" · "}
                <span className="font-medium text-foreground">
                  {juror.pendingGroups === 0
                    ? "Ya calificó todos"
                    : `Le faltan ${juror.pendingGroups ?? groups.length} por calificar`}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <span className="flex shrink-0 flex-wrap items-center gap-2">
        {juror.type === "BACKUP" && <span className="text-xs text-muted-foreground">Suplente</span>}
        {children}
      </span>
    </li>
  );
}
