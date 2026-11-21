import { UserPlus } from "lucide-react";

interface TeamAssignButtonsProps {
  teamId: number;
  assignedCount: number;
  requiredCount: number;
  disabled: boolean;
  onAssign: () => void;
}

/**
 * Espacios vacíos hasta completar los jurados requeridos y, siempre, el botón
 * «Asignar jurado manualmente» para sumar uno más aunque el equipo ya esté
 * completo (ARK-277). El back no limita jurados por equipo; solo advierte.
 */
export function TeamAssignButtons({
  teamId,
  assignedCount,
  requiredCount,
  disabled,
  onAssign,
}: TeamAssignButtonsProps) {
  const emptySlots = Math.max(0, requiredCount - assignedCount);

  return (
    <>
      {Array.from({ length: emptySlots }).map((_, idx) => (
        <button
          key={`empty-${teamId}-${idx}`}
          type="button"
          onClick={onAssign}
          disabled={disabled}
          aria-label="Agregar jurado en espacio vacío"
          className="w-full h-12 md:h-16 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-accent/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <UserPlus className="w-4 md:w-5 h-4 md:h-5" />
          <span className="hidden md:inline">Agregar Jurado</span>
          <span className="md:hidden">Agregar</span>
        </button>
      ))}

      <button
        type="button"
        onClick={onAssign}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-xl border border-border bg-background/50 hover:bg-accent hover:border-primary/50 transition-all flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-foreground shadow-sm disabled:opacity-50"
      >
        <UserPlus className="w-4 h-4 flex-shrink-0" />
        <span>Asignar jurado manualmente</span>
      </button>
    </>
  );
}
