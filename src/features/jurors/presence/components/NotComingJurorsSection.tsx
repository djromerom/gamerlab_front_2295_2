import { Link } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import type { AlertJuror } from "@/features/jurors/presence/api/absenceAlert";
import { AbsentJurorItem } from "./AbsentJurorItem";

const formatBogotaHour = (value: string) =>
  new Intl.DateTimeFormat("es-CO", { timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(value));

interface NotComingJurorsSectionProps {
  jurors: AlertJuror[];
  isAdmin: boolean;
  onRegisterResponse: (juror: AlertJuror) => void;
}

/**
 * HU-44 (ARK-294): bloque «No vendrán». Jurados con «No podrá asistir» vigente: ya no están en
 * «Faltan por llegar», conservan sus grupos y el administrador los cubre con suplentes en
 * Contingencia. Se muestra a cualquier hora, aunque la alerta no esté activa.
 */
export function NotComingJurorsSection({ jurors, isAdmin, onRegisterResponse }: NotComingJurorsSectionProps) {
  if (jurors.length === 0) return null;
  return (
    <section aria-labelledby="not-coming-title" className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="not-coming-title" className="font-semibold">No vendrán ({jurors.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Avisaron que no podrán asistir. Sus grupos siguen asignados a ellos y se cubren con suplentes.
            Si al final llegan y hacen check-in, vuelven a la normalidad.
          </p>
        </div>
        {isAdmin && (
          <Link to="/contingencia-suplentes"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90">
            <LifeBuoy className="size-4" /> Cubrir con suplentes
          </Link>
        )}
      </div>
      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-md border bg-background p-2 text-sm">
        {jurors.map((juror) => (
          <AbsentJurorItem key={juror.jurorId} juror={juror}>
            {juror.notComingSince && (
              <span className="text-xs text-muted-foreground">Desde las {formatBogotaHour(juror.notComingSince)}</span>
            )}
            {isAdmin && (
              <button type="button" onClick={() => onRegisterResponse(juror)}
                aria-label={`Registrar respuesta de ${juror.name}`}
                className="rounded border px-2 py-1 text-xs hover:bg-muted">
                Registrar respuesta
              </button>
            )}
          </AbsentJurorItem>
        ))}
      </ul>
    </section>
  );
}
