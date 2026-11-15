import { useState } from "react";
import { useAssignmentWarnings } from "@/features/jurors/assignment/hooks/useAssignmentWarnings";
import {
  ASSIGN_FAILED_MESSAGE,
  assignWalkInTeams,
  fetchTeamSuggestion,
  type TeamSuggestion,
  type WalkInAssignmentResult,
} from "@/features/jurors/attendance/api/walkInJurors";
import { teamsOfLevel, toggleTeam } from "@/features/jurors/attendance/lib/walkInJuror";

/**
 * «Asignar grupos automáticamente» (HU-24): pide la propuesta (no guarda nada), deja confirmarla o
 * editarla (quitar o cambiar grupos del mismo nivel) y asigna sumando. Si el back responde con
 * advertencias de HU-08 abre el diálogo de siempre y repite con `confirmWarnings: true`.
 */
export function useWalkInTeamAssignment(jurorId: string | null, onAssigned: () => void) {
  const [suggestion, setSuggestion] = useState<TeamSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalkInAssignmentResult | null>(null);
  const warnings = useAssignmentWarnings();

  const propose = async () => {
    if (!jurorId) return;
    setLoading(true);
    setLoadError(null);
    setError(null);
    setEditing(false);
    try {
      const data = await fetchTeamSuggestion(jurorId);
      setSuggestion(data);
      setSelected(data.teams.map((team) => team.id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo calcular la propuesta de grupos.");
    } finally {
      setLoading(false);
    }
  };

  const assign = async (confirmWarnings = false) => {
    if (!jurorId || selected.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      setResult(await assignWalkInTeams(jurorId, selected, confirmWarnings));
      onAssigned();
    } catch (err) {
      if (warnings.askToConfirm(err, () => assign(true))) return;
      setError(err instanceof TypeError ? ASSIGN_FAILED_MESSAGE : err instanceof Error ? err.message : ASSIGN_FAILED_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSuggestion(null);
    setLoadError(null);
    setSelected([]);
    setEditing(false);
    setError(null);
    setResult(null);
  };

  return {
    suggestion,
    /** Grupos que se pueden elegir al editar: los propuestos y los demás del nivel. */
    options: suggestion ? teamsOfLevel(suggestion) : [],
    loading,
    loadError,
    propose: () => void propose(),
    selected,
    toggle: (id: number) => setSelected((ids) => toggleTeam(ids, id)),
    editing,
    edit: () => setEditing(true),
    submitting,
    error,
    result,
    assign: () => void assign(false),
    reset,
    warnings,
  };
}
