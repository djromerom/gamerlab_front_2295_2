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
