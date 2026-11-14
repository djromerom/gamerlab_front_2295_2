import { normalizeEmail, type CombinedFormValues } from "@/features/teams/lib/schemas";

/**
 * Utilidades del registro de equipos (chore registro-equipos-validaciones, a partir del beta-test
 * del 1 de noviembre).
 */

/** Ruta pública de revisión de un nombre, codificado y sin espacios en los extremos. */
export function nameCheckUrl(base: string, kind: "name" | "videogame", value: string): string {
  return `${base}/teams/${kind}/${encodeURIComponent(value.trim())}`;
}

/**
 * Mensaje de error de la API listo para el alumno: une las listas y quita el prefijo del campo
 * anidado que agrega class-validator ("videogame.", "members.0.").
 */
export function cleanApiMessage(message: unknown): string {
  const parts = Array.isArray(message)
    ? message
    : typeof message === "string"
      ? [message]
      : message && typeof message === "object"
        ? Object.values(message)
        : [];
  return parts
    .map((part) => String(part).replace(/^(?:[A-Za-z]+\.(?:\d+\.)?)+/, ""))
    .filter(Boolean)
    .join(", ");
}

type RegistrationPayloadFiles = { logoUrl?: string; additionalImages: string[] };

/** Cuerpo de POST /teams. Sin logo no se envía `logoUrl` (`""` respondía 400). */
export function buildRegistrationPayload(
  data: CombinedFormValues,
  files: RegistrationPayloadFiles,
) {
  const videogame: Record<string, unknown> = {
    vgName: data.gameName.trim(),
    description: data.description.trim(),
    videoUrl: data.YoutubeUrl?.trim() ?? "",
    repoUrl: data.RepoUrl?.trim() ?? "",
    additionalImages: files.additionalImages,
  };
  if (files.logoUrl) videogame.logoUrl = files.logoUrl;

  return {
    teamName: data.teamName.trim(),
    members: data.members.map((m) => ({
      memberFirstName: m.nombre.trim(),
      memberLastName: m.apellido.trim(),
      memberEmail: m.correo.trim().toLowerCase(),
      studentCode: m.codigoEstudiantil.trim(),
      nrc: m.nrc,
    })),
    videogame,
    recaptchaToken: data.recaptcha,
  };
}

/** Opción del selector de NRC: "3501 · Programación I"; sin materia, solo el número. */
export function nrcLabel(option: {
  code: number | string;
  name?: string;
  professorName?: string;
  subject?: { name?: string } | null;
}): string {
  const subject = option.subject?.name ?? option.name;
  const label = subject ? `${option.code} · ${subject}` : String(option.code);
  return option.professorName ? `${label} · ${option.professorName}` : label;
}

/* ---------- Borrador en sessionStorage (recargar borraba todo) ---------- */

export const REGISTRATION_DRAFT_KEY = "arkad:registro-equipo:borrador";

/** Lo que se guarda: solo texto. Los archivos, el captcha y el consentimiento no se guardan. */
export type RegistrationDraft = {
  step: number;
  values: Pick<
    CombinedFormValues,
    "teamName" | "members" | "gameName" | "description" | "YoutubeUrl" | "RepoUrl"
  >;
};

export function saveRegistrationDraft(step: number, values: CombinedFormValues): void {
  const draft: RegistrationDraft = {
    step,
    values: {
      teamName: values.teamName ?? "",
      members: (values.members ?? []).map((m) => ({
        nombre: m.nombre ?? "",
        apellido: m.apellido ?? "",
        correo: m.correo ?? "",
        confirmarCorreo: m.confirmarCorreo ?? "",
        codigoEstudiantil: m.codigoEstudiantil ?? "",
        nrc: m.nrc ?? [],
      })),
      gameName: values.gameName ?? "",
      description: values.description ?? "",
      YoutubeUrl: values.YoutubeUrl ?? "",
      RepoUrl: values.RepoUrl ?? "",
    },
  };
  try {
    sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* almacenamiento bloqueado o lleno: el formulario sigue funcionando sin borrador */
  }
}

export function loadRegistrationDraft(): RegistrationDraft | null {
  try {
    const raw = sessionStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as RegistrationDraft;
    if (!draft || typeof draft !== "object" || !draft.values) return null;
    const rawMembers = Array.isArray(draft.values.members) ? draft.values.members : [];
    const members = rawMembers.slice(0, 5).map((m) => ({
      nombre: String(m?.nombre ?? ""),
      apellido: String(m?.apellido ?? ""),
      correo: String(m?.correo ?? ""),
      confirmarCorreo: String(m?.confirmarCorreo ?? ""),
      codigoEstudiantil: String(m?.codigoEstudiantil ?? ""),
      nrc: Array.isArray(m?.nrc) ? m.nrc.map(String) : [],
    }));
    // el paso 4 tiene el captcha y los archivos: se vuelve como máximo al paso 3
    let step = Math.min(Math.max(Number(draft.step) || 0, 0), 2);
    // Un correo sin repetir (borrador de antes de ARK-168) se corrige en el paso de integrantes:
    // más adelante el error quedaría en un campo que no se ve
    if (members.some((m) => normalizeEmail(m.correo) !== normalizeEmail(m.confirmarCorreo))) {
      step = Math.min(step, 1);
    }
    return {
      step,
      values: {
        teamName: String(draft.values.teamName ?? ""),
        members,
        gameName: String(draft.values.gameName ?? ""),
        description: String(draft.values.description ?? ""),
        YoutubeUrl: String(draft.values.YoutubeUrl ?? ""),
        RepoUrl: String(draft.values.RepoUrl ?? ""),
      },
    };
  } catch {
    return null;
  }
}

export function clearRegistrationDraft(): void {
  try {
    sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
  } catch {
    /* nada que limpiar */
  }
}
