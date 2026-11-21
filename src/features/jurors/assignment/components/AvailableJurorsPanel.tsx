import { AlertTriangle, ChevronRight, Shield, Users } from "lucide-react";
import type { Jurado } from "@/features/jurors/types/jurors";
import {
  getInitials,
  getJurorCategoryLabel,
  getJurorTypeLabel,
} from "@/features/jurors/types/jurors";

interface AvailableJurorsPanelProps {
  oficiales: Jurado[];
  suplentes: Jurado[];
  /** En celular y tablet el panel se pliega; en `lg` siempre se ve. */
  expandedMobile: boolean;
  onToggleMobile: () => void;
}

/*
 * ARK-279 (BG-70): en `lg` la columna es sticky, así que no puede medir más que la
 * pantalla o su parte de abajo (Suplentes) queda fuera de vista hasta llegar al final
 * de la página. Por eso mide como máximo el alto visible y tiene un solo scroll; las
 * listas solo tienen scroll propio por debajo de `lg`, donde el panel no es sticky.
 */
const LIST_CLASSES =
  "space-y-2 md:space-y-3 max-h-[400px] overflow-y-auto pr-2 lg:max-h-none lg:overflow-visible lg:pr-0";

function JurorList({
  label,
  jurados,
  emptyMessage,
}: {
  label: string;
  jurados: Jurado[];
  emptyMessage: string;
}) {
  if (jurados.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8 text-sm">{emptyMessage}</p>
    );
  }

  return (
    <ul aria-label={label} className={LIST_CLASSES}>
      {jurados.map((jurado) => (
        <li
          key={jurado.id}
          className="bg-card border border-border rounded-xl p-2 md:p-3 transition-all"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-border flex items-center justify-center bg-muted text-xs font-medium">
              {getInitials(jurado.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs md:text-sm font-medium truncate">{jurado.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {getJurorCategoryLabel(jurado.jurorCategory)} • {getJurorTypeLabel(jurado.tipo)}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AvailableJurorsPanel({
  oficiales,
  suplentes,
  expandedMobile,
  onToggleMobile,
}: AvailableJurorsPanelProps) {
  return (
    <aside
      aria-label="Disponibilidad de jurados"
      className={`lg:col-span-1 order-1 lg:order-2 self-start lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-2 lg:mb-0 transition-all duration-200 ${expandedMobile ? "mb-6" : "mb-1.5"}`}
    >
      {/* Botón para plegar el panel en celular y tablet */}
      <button
        type="button"
        onClick={onToggleMobile}
        aria-expanded={expandedMobile}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-all lg:hidden ${expandedMobile ? "mb-3" : "mb-0"}`}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Disponibilidad de Jurados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
            {oficiales.length + suplentes.length} libres
          </span>
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedMobile ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      <div
        className={`space-y-4 md:space-y-6 ${expandedMobile ? "block animate-in fade-in duration-200" : "hidden lg:block"}`}
      >
        <section>
          <h3 className="text-base md:text-xl mb-3 md:mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span>Jurados Oficiales</span>
          </h3>

          <div className="bg-card border border-border rounded-xl p-3 mb-3">
            <p className="text-xs text-muted-foreground">
              Disponibles:{" "}
              <span className="font-bold text-lg text-foreground">{oficiales.length}</span>
            </p>
          </div>

          <JurorList
            label="Jurados oficiales disponibles"
            jurados={oficiales}
            emptyMessage="No hay jurados oficiales disponibles"
          />
        </section>

        <section>
          <h3 className="text-base md:text-xl mb-3 md:mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Jurados Suplentes</span>
          </h3>

          <div className="bg-card border border-border rounded-xl p-3 mb-3">
            <p className="text-xs text-muted-foreground mb-1">
              Disponibles:{" "}
              <span className="font-bold text-lg text-foreground">{suplentes.length}</span>
            </p>
            <p className="text-xs text-muted-foreground">Úsalos solo si un oficial no llega</p>
          </div>

          <JurorList
            label="Jurados suplentes disponibles"
            jurados={suplentes}
            emptyMessage="No hay jurados suplentes disponibles"
          />
        </section>
      </div>
    </aside>
  );
}
