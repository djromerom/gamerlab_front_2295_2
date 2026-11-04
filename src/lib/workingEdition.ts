/**
 * ARK-130 (HU-27): la edición de trabajo es la ACTIVE (la más reciente si hubiera dos), nunca
 * «la de id más alto». `null` si no hay ninguna activa.
 */
export function findWorkingEdition<T extends { id: number; status: string }>(editions: T[]): T | null {
  return (
    editions
      .filter((edition) => edition.status === "ACTIVE")
      .sort((a, b) => b.id - a.id)[0] ?? null
  );
}

/** Cómo se nombra la edición de trabajo en un texto; sin nombre conocido, «la edición activa». */
function editionLabel(editionTitle?: string | null): string {
  return editionTitle ? `«${editionTitle}»` : "la edición activa";
}

/**
 * ARK-133 (BG-20): confirmación de «quitar todas las asignaciones». El back solo borra las de la
 * edición activa; el texto lo dice para que nadie crea que se borra el historial.
 */
export function confirmRemoveAllAssignmentsText(editionTitle?: string | null): string {
  return (
    `¿Seguro que quieres eliminar todas las asignaciones de jurados de ${editionLabel(editionTitle)}? ` +
    "Las asignaciones de ediciones anteriores se conservan."
  );
}

/** ARK-133 (BG-20): confirmación de «quitar todos los equipos» de un jurado. */
export function confirmRemoveJurorAssignmentsText(
  jurorName: string,
  editionTitle?: string | null,
): string {
  return (
    `¿Seguro que quieres quitar todos los equipos asignados a ${jurorName} en ${editionLabel(editionTitle)}? ` +
    "Sus asignaciones de ediciones anteriores se conservan."
  );
}
