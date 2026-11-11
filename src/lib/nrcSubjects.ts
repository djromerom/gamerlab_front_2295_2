/**
 * Materias y NRC del paso «Inscripción de Miembros» (HU-31, ARK-193): agrupa las opciones de
 * la edición activa por materia y calcula qué materias marcó cada integrante.
 */

/** Opción de `GET /nrcs/select-options?includeSubjects=true` (ARK-167). */
export interface NrcOption {
  code: number | string;
  name?: string;
  subjectId?: number;
  professorName?: string;
  subject?: { id?: number; name?: string; abrevName?: string } | null;
  [key: string]: unknown;
}

export interface SubjectInfo {
  id: string;
  name: string;
  abrevName: string;
}

/** Id de la materia de un NRC, como texto ("" si la API no la trae). */
export const subjectIdOf = (option: NrcOption | undefined): string =>
  String(option?.subjectId ?? option?.subject?.id ?? "");

/** Materias de los NRC de la edición activa, sin repetir y en el orden que llegan. */
export function subjectsFromOptions(options: NrcOption[]): SubjectInfo[] {
  const subjects = new Map<string, SubjectInfo>();
  options.forEach((option) => {
    const id = subjectIdOf(option);
    if (!id || subjects.has(id)) return;
    const name = option.subject?.name ?? option.name ?? `Materia ${id}`;
    subjects.set(id, { id, name, abrevName: option.subject?.abrevName || name });
  });
  return [...subjects.values()];
}

/** Texto de cada NRC en el desplegable: "3031 · Prof. Ana Ruiz". */
export const nrcOptionText = (option: NrcOption): string =>
  option.professorName ? `${option.code} · Prof. ${option.professorName}` : String(option.code);

/**
 * Materias marcadas de un integrante: las que marcó con el botón y las que ya tienen NRC (por
 * ejemplo, al volver de un borrador), en el orden de la lista de materias.
 */
export function markedSubjectIds(
  subjects: SubjectInfo[],
  options: NrcOption[],
  selectedCodes: string[],
  pending: string[],
): string[] {
  const subjectByCode = new Map(options.map((option) => [String(option.code), subjectIdOf(option)]));
  const withNrc = new Set(selectedCodes.map((code) => subjectByCode.get(String(code))));
  return subjects
    .filter((subject) => withNrc.has(subject.id) || pending.includes(subject.id))
    .map((subject) => subject.id);
}

/** Materias marcadas que todavía no tienen NRC. */
export function subjectsMissingNrc(
  subjects: SubjectInfo[],
  options: NrcOption[],
  selectedCodes: string[],
  pending: string[],
): SubjectInfo[] {
  const subjectByCode = new Map(options.map((option) => [String(option.code), subjectIdOf(option)]));
  const withNrc = new Set(selectedCodes.map((code) => subjectByCode.get(String(code))));
  const marked = markedSubjectIds(subjects, options, selectedCodes, pending);
  return subjects.filter((subject) => marked.includes(subject.id) && !withNrc.has(subject.id));
}
