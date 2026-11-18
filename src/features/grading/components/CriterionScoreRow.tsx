import CriteriaButton from "@/features/grading/components/CriteriaButton";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { criterionScoreInputId, formatCriterionScore } from "@/features/grading/lib/criteriaScores";
import type { UiCriterion } from "@/features/grading/types/criterion";

interface CriterionScoreRowProps {
  criterion: UiCriterion;
  /** ARK-249: se intentó enviar con este criterio vacío. */
  isMissing: boolean;
  onFocus: (criterionId: number) => void;
  onChange: (criterionId: number, rawValue: string) => void;
}

/** Fila de un criterio en la calificación individual (RatePage y SchoolRatePage). */
export default function CriterionScoreRow({ criterion, isMissing, onFocus, onChange }: CriterionScoreRowProps) {
  const inputId = criterionScoreInputId(criterion.id);
  const hintId = `criterion-missing-${criterion.id}`;

  return (
    <TableRow>
      <TableCell colSpan={2} className="font-medium text-base px-0 whitespace-normal break-words">
        {criterion.name} ({(criterion.weight * 100).toFixed(0)}%)
        <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">
            Puntuación:
          </label>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              id={inputId}
              type="text"
              inputMode="decimal"
              aria-invalid={isMissing || undefined}
              aria-describedby={isMissing ? hintId : undefined}
              value={criterion.score ?? ""}
              onFocus={() => onFocus(criterion.id)}
              onChange={(e) => onChange(criterion.id, e.target.value)}
              placeholder={`0 - ${criterion.maxScore}`}
              className="border rounded px-2 py-1 w-full md:w-24 bg-transparent text-sm"
            />

            <span className="text-sm font-medium whitespace-nowrap">
              {formatCriterionScore(criterion.score, criterion.maxScore)}
            </span>
            <CriteriaButton description={criterion.description || "Sin descripción detallada."} />
          </div>
        </div>
        {isMissing && (
          <p id={hintId} className="mt-1 text-sm font-normal text-red-600 dark:text-red-500">
            Falta calificar este criterio. Si la nota es 0, escribe 0.
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}
