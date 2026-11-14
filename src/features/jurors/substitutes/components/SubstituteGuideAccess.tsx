import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubstituteNotices } from "@/features/jurors/substitutes/contexts/SubstituteNoticesContext";

/** En el inicio del suplente: vuelve a abrir la explicación (HU-22). */
export function SubstituteGuideAccess({ className = "" }: { className?: string }) {
  const { isSubstitute, openGuide } = useSubstituteNotices();
  if (!isSubstitute) return null;

  return (
    <div role="note" className={`flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 p-3 text-sm ${className}`}>
      <span className="flex items-start gap-2">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        Eres jurado suplente: si te asignan grupos te avisaremos aquí y por correo.
      </span>
      <Button type="button" variant="outline" size="sm" onClick={openGuide}>
        ¿Qué hace un suplente?
      </Button>
    </div>
  );
}
