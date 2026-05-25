import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Power, Pencil, Calendar, Plus } from "lucide-react";

interface Edition {
  id: number;
  year: number;
  semester: number;
  title: string;
  isActive: boolean;
}

interface EditionsListProps {
  editions: Edition[];
  onSelectEdition: (id: number) => void;
  onCreateNew: () => void;
}

const semesterLabel: Record<number, string> = {
  10: "Primer Semestre",
  20: "Intersemestral",
  30: "Segundo Semestre",
};

export const EditionsTable: React.FC<EditionsListProps> = ({
  editions,
  onSelectEdition,
  onCreateNew,
}) => {

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {editions.length} edición{editions.length !== 1 ? "es" : ""} registrada{editions.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={onCreateNew}
          className="bg-[#AC7CFF] hover:bg-[#8A5CD6] text-black font-semibold min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Edición
        </Button>
      </div>

      {/* Cards list */}
      <div className="flex flex-col gap-3">
        {editions.map((edition) => (
          <div
            key={edition.id}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all duration-200 hover:border-[#AC7CFF]/40 hover:bg-card/80"
          >
            {/* Active indicator dot */}
            <div
              className={`shrink-0 w-2.5 h-2.5 rounded-full ${edition.isActive ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" : "bg-muted-foreground/30"
                }`}
            />

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="font-semibold text-foreground truncate">{edition.title}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{edition.year} · {semesterLabel[edition.semester] ?? `Semestre ${edition.semester}`}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectEdition(edition.id)}
                className="text-[#AC7CFF] hover:text-[#8A5CD6] hover:bg-[#AC7CFF]/10 min-h-[44px] min-w-[44px]"
                title="Editar edición"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {editions.length === 0 && (
          <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-xl">
            No hay ediciones registradas aún.
          </div>
        )}
      </div>
    </div>
  );
};
