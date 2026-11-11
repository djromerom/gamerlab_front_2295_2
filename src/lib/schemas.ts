import { z } from "zod";

/** Correo comparable: sin espacios en los extremos y en minúsculas. */
export const normalizeEmail = (value: string | undefined | null): string =>
  (value ?? "").trim().toLowerCase();

export const EMAIL_MISMATCH_MESSAGE = "Los correos no coinciden";
export const NO_PASTE_MESSAGE = "Escribe el correo a mano: aquí no se puede pegar ni arrastrar texto.";

export const MemberSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, { message: "El nombre es obligatorio" })
    .max(50, { message: "El nombre supera los 50 caracteres" }),
  apellido: z
    .string()
    .trim()
    .min(1, { message: "El apellido es obligatorio" })
    .max(50, { message: "El apellido supera los 50 caracteres" }),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "El correo es obligatorio" })
    .email({ message: "El correo debe ser válido" }),
  // Se escribe dos veces, sin pegar, para evitar errores de digitación (ARK-168). No se envía.
  confirmarCorreo: z.string().trim().min(1, { message: "Repite el correo" }),
  codigoEstudiantil: z
    .string()
    .trim()
    .min(1, { message: "El código estudiantil es obligatorio" })
    .max(20, { message: "El código estudiantil supera los 20 caracteres" })
    .regex(/^\d+$/, { message: "El código estudiantil solo puede tener números" }),
  nrc: z
    .array(z.string())
    .min(1, { message: "Debe seleccionar al menos un NRC" }),
});

/**
 * Cada integrante repite su correo igual (sin importar mayúsculas ni espacios en los extremos),
 * y dos integrantes no pueden compartir correo ni código estudiantil.
 */
export const MembersSchema = z
  .array(MemberSchema)
  .min(1, { message: "El equipo debe tener al menos un integrante" })
  .superRefine((members, ctx) => {
    const emails = new Map<string, number>();
    const codes = new Map<string, number>();
    members.forEach((member, index) => {
      const email = normalizeEmail(member.correo);
      const confirmation = normalizeEmail(member.confirmarCorreo);
      if (confirmation && confirmation !== email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "confirmarCorreo"],
          message: EMAIL_MISMATCH_MESSAGE,
        });
      }
      if (email) {
        if (emails.has(email)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "correo"],
            message: `Este correo ya está en el integrante ${emails.get(email)! + 1}`,
          });
        } else {
          emails.set(email, index);
        }
      }
      const code = member.codigoEstudiantil.trim();
      if (code) {
        if (codes.has(code)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "codigoEstudiantil"],
            message: `Este código ya está en el integrante ${codes.get(code)! + 1}`,
          });
        } else {
          codes.set(code, index);
        }
      }
    });
  });

/** URL opcional: vacía está bien; si hay texto, debe ser http(s). */
const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => !value || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value), { message });

export const CombinedSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(1, { message: "El nombre del equipo es obligatorio" })
    .max(50, { message: "El nombre del equipo supera los 50 caracteres." }),
  members: MembersSchema,
  gameName: z
    .string()
    .trim()
    .min(1, { message: "El nombre del videojuego es obligatorio" })
    .max(30, { message: "El nombre del videojuego supera los 30 caracteres." }),
  description: z.string().trim(),
  YoutubeUrl: optionalUrl("La URL de YouTube debe empezar por https:// y ser válida"),
  RepoUrl: optionalUrl("La URL del repositorio debe empezar por https:// y ser válida"),
  files: z
    .array(z.instanceof(File))
    .min(1, { message: "El logo del videojuego es obligatorio" }),
  additionalFiles: z.array(z.instanceof(File)).default([]),
  recaptcha: z
    .string()
    .min(1, { message: "La verificación de reCAPTCHA es obligatoria" }),
  dataConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: "Debe aceptar el tratamiento de datos personales",
    }),
});

// Define CombinedFormValues with explicit types to match form expectations
export type CombinedFormValues = {
  teamName: string;
  members: {
    nombre: string;
    apellido: string;
    correo: string;
    confirmarCorreo: string;
    codigoEstudiantil: string;
    nrc: string[];
  }[];
  gameName: string;
  description: string;
  YoutubeUrl?: string | undefined;
  RepoUrl?: string | undefined;
  files: File[];
  additionalFiles: File[];
  recaptcha: string;
  dataConsent: boolean;
};
