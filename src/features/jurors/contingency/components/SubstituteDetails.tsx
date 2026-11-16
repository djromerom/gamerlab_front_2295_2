import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RankedSubstitute } from "@/features/jurors/contingency/api/contingency";
import { categoryLabel, plural } from "@/features/jurors/contingency/lib/contingency";

/** Datos del suplente para decidir rápido: categoría, carga, llegada y por qué se propone. */
export function SubstituteDetails({ substitute }: { substitute: RankedSubstitute }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {substitute.categoria ? (
        <span>{categoryLabel(substitute.categoria)}</span>
      ) : (
        // Las reglas de HU-08 bloquean a un jurado sin categoría: aceptarlo fallaría
        <Badge
          variant="outline"
          title="Las reglas de asignación no aceptan a un jurado sin categoría. Asígnala en Personal → Jurados."
          className="border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-400"
        >
          <TriangleAlert /> Sin categoría: no se podrá asignar
        </Badge>
      )}
      <span aria-hidden>·</span>
      <span>{plural(substitute.carga, "grupo")} si se acepta</span>
      <Badge variant={substitute.llegada ? "success" : "outline"}>
        {substitute.llegada ? "Llegó" : "Sin llegada"}
      </Badge>
      {substitute.mismoNivel && <Badge variant="secondary">Mismo nivel</Badge>}
      {substitute.mismaCategoria && <Badge variant="secondary">Misma categoría</Badge>}
      {substitute.rechazado && <Badge variant="outline">Rechazado para este grupo</Badge>}
    </span>
  );
}
