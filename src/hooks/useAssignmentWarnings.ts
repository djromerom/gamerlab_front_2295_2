import { useState } from "react";
import {
  AssignmentWarningsError,
  type AssignmentWarning,
} from "@/lib/assignmentWarnings";

interface PendingConfirmation {
  warnings: AssignmentWarning[];
  confirm: () => Promise<void>;
}

/**
 * Estado del diálogo de advertencias (HU-08). `askToConfirm` recibe el error de una
 * petición y la función que la repite con `confirmWarnings: true`; si el error trae
 * advertencias, abre el diálogo y devuelve true para que quien llama no muestre otro aviso.
 */
export function useAssignmentWarnings() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  const askToConfirm = (error: unknown, confirm: () => Promise<void>) => {
    if (!(error instanceof AssignmentWarningsError)) return false;
    setPending({ warnings: error.warnings, confirm });
    return true;
  };

  const continueWithWarnings = () => {
    if (!pending) return;
    setPending(null);
    void pending.confirm();
  };

  const cancel = () => setPending(null);

  return {
    warnings: pending?.warnings ?? null,
    askToConfirm,
    continueWithWarnings,
    cancel,
  };
}
