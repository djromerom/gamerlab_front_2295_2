import { subjectIdOf, type NrcOption, type SubjectInfo } from "@/features/teams/lib/nrcSubjects";

/**
 * Reglas de materias del paso «Inscripción de Miembros» (ARK-193).
 *
 * 1. Un integrante no puede marcar dos materias de la cadena de prerrequisitos
 *    (Algoritmia I → Algoritmia II → POO y Estructuras de Datos I → Estructuras de Datos II).
 *    Lo único que se puede marcar junto es POO con una de las Estructuras de Datos.
 *    Cualquier otra materia (Algoritmia, Colegios, Proyecto Final...) va sola.
 * 2. Desde el segundo integrante, cada uno comparte al menos una materia con alguno de los
 *    anteriores. El NRC puede ser distinto: dos integrantes de AYP I en grupos diferentes sirven.
 *
 * La materia se reconoce por su abreviatura del catálogo (POO, EDD), que es la misma en todos los
 * ambientes aunque el nombre cambie («Estructuras de Datos I», «Estructura de Datos 1»). Si la
 * abreviatura no es ninguna de esas, se intenta por el nombre.
 */
type Family = "POO" | "EDD";

const FAMILY_BY_ABREV: Record<string, Family> = { POO: "POO", EDD: "EDD" };

const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function familyByName(name: string): Family | undefined {
  const n = normalize(name);
  if (n.startsWith("programacion orientada a objetos")) return "POO";
  if (/^estructuras? de datos\b/.test(n)) return "EDD";
  return undefined;
}

/** Familia (POO o EDD) de cada materia de las opciones, por id de materia. */
export function subjectFamilies(options: NrcOption[]): Map<string, Family> {
  const families = new Map<string, Family>();
  options.forEach((option) => {
    const id = subjectIdOf(option);
    if (!id || families.has(id)) return;
    const abrev = String(option.subject?.abrevName ?? "").trim().toUpperCase();
    const family = FAMILY_BY_ABREV[abrev] ?? familyByName(option.subject?.name ?? option.name ?? "");
    if (family) families.set(id, family);
  });
  return families;
}

export const COMBINATION_HINT =
  "Solo se pueden marcar juntas Programación Orientada a Objetos y una Estructura de Datos.";

/** Si un integrante puede marcar las dos materias a la vez: POO con una Estructura de Datos. */
export function canCombine(a: SubjectInfo, b: SubjectInfo, families: Map<string, Family>): boolean {
  if (a.id === b.id) return true;
  const pair = [families.get(a.id), families.get(b.id)].sort().join("+");
  return pair === "EDD+POO";
}

/**
 * Por qué no se puede marcar `candidate` junto a las materias ya marcadas, o `null` si se puede.
 * Lo usa el botón de cada materia para deshabilitarse.
 */
export function blockedReason(
  marked: SubjectInfo[],
  candidate: SubjectInfo,
  families: Map<string, Family>,
): string | null {
  const conflict = marked.find((subject) => !canCombine(subject, candidate, families));
  if (!conflict) return null;
  return `No se puede marcar junto con ${conflict.name}. ${COMBINATION_HINT}`;
}

/** El primer par de materias marcadas que no se puede combinar, si lo hay. */
export function invalidCombination(
  marked: SubjectInfo[],
  families: Map<string, Family>,
): [SubjectInfo, SubjectInfo] | null {
  for (let i = 0; i < marked.length; i++) {
    for (let j = i + 1; j < marked.length; j++) {
      if (!canCombine(marked[i], marked[j], families)) return [marked[i], marked[j]];
    }
  }
  return null;
}

/**
 * Integrantes (índices) que no comparten ninguna materia con los anteriores. Recibe los ids de
 * materia de cada integrante; el NRC no importa. Se omiten los que aún no tienen materias: ese
 * caso ya lo informa el formulario.
 */
export function membersWithoutSharedSubject(subjectIdsByMember: string[][]): number[] {
  const seen = new Set<string>();
  const lonely: number[] = [];
  subjectIdsByMember.forEach((ids, index) => {
    const own = ids.map(String);
    if (index > 0 && own.length > 0 && seen.size > 0 && !own.some((id) => seen.has(id))) {
      lonely.push(index);
    }
    own.forEach((id) => seen.add(id));
  });
  return lonely;
}

export const SHARED_SUBJECT_MESSAGE =
  "Debe compartir al menos una materia con un integrante anterior (el NRC puede ser distinto).";
