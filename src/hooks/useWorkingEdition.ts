import { useEffect, useState } from "react";
import { fetchEditions, type Edition } from "@/fetchs/editions";
import { findWorkingEdition } from "@/lib/workingEdition";

/**
 * ARK-133: la edición de trabajo (ACTIVE) para nombrarla en los textos de confirmación.
 * `undefined` mientras carga o si falla la lista; `null` si no hay edición activa.
 */
export function useWorkingEdition(): Edition | null | undefined {
  const [edition, setEdition] = useState<Edition | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchEditions()
      .then((editions) => !cancelled && setEdition(findWorkingEdition(editions)))
      .catch(() => !cancelled && setEdition(undefined));
    return () => {
      cancelled = true;
    };
  }, []);

  return edition;
}
