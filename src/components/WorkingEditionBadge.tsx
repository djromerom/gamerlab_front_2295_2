import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarRange } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { fetchEditions, type Edition } from "@/api/editions";
import { findWorkingEdition } from "@/lib/workingEdition";

/**
 * ARK-130 (HU-27): el administrador siempre ve sobre qué edición trabaja. Todo lo que inscribe,
 * asigna, edita o borra va a la edición activa; las demás se consultan como historial.
 */
export function WorkingEditionBadge() {
  const { state, isMobile } = useSidebar();
  const [edition, setEdition] = useState<Edition | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchEditions()
      .then((editions) => !cancelled && setEdition(findWorkingEdition(editions)))
      .catch(() => !cancelled && setEdition(undefined)); // sin la lista no se muestra nada
    return () => {
      cancelled = true;
    };
  }, []);

  if (edition === undefined || (state === "collapsed" && !isMobile)) return null;

  return (
    <Link
      to="/gestionar-ediciones"
      className="mx-2 flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs hover:bg-accent"
      aria-label="Edición de trabajo"
    >
      {edition ? (
        <>
          <CalendarRange className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block text-muted-foreground">Edición de trabajo</span>
            <span className="block font-medium">{edition.title}</span>
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <span>
            <span className="block font-medium">Sin edición activa</span>
            <span className="block text-muted-foreground">Actívala en Ediciones para inscribir y asignar.</span>
          </span>
        </>
      )}
    </Link>
  );
}
