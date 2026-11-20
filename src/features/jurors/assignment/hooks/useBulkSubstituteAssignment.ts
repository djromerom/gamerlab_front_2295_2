import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SAVE_FAILED_MESSAGE,
  assignSubstitutesInBulk,
  fetchEditionEvaluators,
  type BulkSubstituteAssignmentResult,
  type EditionEvaluator,
} from "@/features/jurors/assignment/api/bulkSubstitutes";
import { useAssignmentWarnings } from "@/features/jurors/assignment/hooks/useAssignmentWarnings";
import { selectionProblem, splitCandidates } from "@/features/jurors/assignment/lib/bulkSubstitutes";

const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

/**
 * Estado del diálogo de suplentes en lote (HU-09). Carga los jurados al abrir; si el back responde
 * con advertencias de HU-08 abre el diálogo de siempre y, si el admin confirma, repite la misma
 * petición con `confirmWarnings: true`. `onAssigned` refresca la pantalla de asignación.
 */
export function useBulkSubstituteAssignment(open: boolean, onAssigned: () => void) {
  const [evaluators, setEvaluators] = useState<EditionEvaluator[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jurorIds, setJurorIds] = useState<string[]>([]);
  const [substituteIds, setSubstituteIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkSubstituteAssignmentResult | null>(null);
  const warnings = useAssignmentWarnings();

  const load = useCallback(async () => {
    setLoadError(null);
    setEvaluators(null);
    try {
      setEvaluators(await fetchEditionEvaluators());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar la lista de jurados.");
    }
  }, []);

  // Cada vez que se abre parte de cero, con la lista al día.
  useEffect(() => {
    if (!open) return;
    setJurorIds([]);
    setSubstituteIds([]);
    setError(null);
    setResult(null);
    void load();
  }, [open, load]);

  const { coverable, substitutes } = useMemo(() => splitCandidates(evaluators ?? []), [evaluators]);

  const toggleJuror = (id: string) => {
    setJurorIds((ids) => toggle(ids, id));
    // Si pasa a ser jurado a cubrir, no puede seguir como suplente.
    setSubstituteIds((ids) => ids.filter((x) => x !== id));
  };
  const toggleSubstitute = (id: string) => setSubstituteIds((ids) => toggle(ids, id));

  const submit = async (confirmWarnings = false) => {
    setSubmitting(true);
    setError(null);
    try {
      const saved = await assignSubstitutesInBulk({ jurorIds, substituteIds, ...(confirmWarnings && { confirmWarnings: true }) });
      setResult(saved);
      onAssigned();
    } catch (err) {
      if (warnings.askToConfirm(err, () => submit(true))) return;
      setError(err instanceof TypeError ? SAVE_FAILED_MESSAGE : err instanceof Error ? err.message : SAVE_FAILED_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading: evaluators === null && loadError === null,
    loadError,
    reload: load,
    coverable,
    substitutes,
    jurorIds,
    substituteIds,
    toggleJuror,
    toggleSubstitute,
    problem: selectionProblem(jurorIds, substituteIds),
    submitting,
    error,
    result,
    submit: () => void submit(false),
    warnings,
  };
}
