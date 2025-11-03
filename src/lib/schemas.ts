import { z } from "zod";

export const MemberSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
  apellido: z.string().min(1, { message: "El apellido es obligatorio" }),
  correo: z
    .string()
    .min(1, { message: "El correo es obligatorio" })
    .email({ message: "El correo debe ser válido" })
    .refine((email) => email.endsWith("@uninorte.edu.co"), {
      message: "El correo debe ser institucional (@uninorte.edu.co)",
    }),
  codigoEstudiantil: z
    .string()
    .min(1, { message: "El código estudiantil es obligatorio" }),
  nrc: z
    .array(z.string())
    .min(1, { message: "Debe seleccionar al menos un NRC" }),
});

export const CombinedSchema = z.object({
  teamName: z
    .string()
    .min(1, { message: "El nombre del equipo es obligatorio" })
    .max(50, { message: "EL nombre del equipo supera los 50 caracteres." }),
  members: z
    .array(MemberSchema)
    .min(1, { message: "El equipo debe tener al menos un integrante" }),
  gameName: z
    .string()
    .min(1, { message: "El nombre del videojuego es obligatorio" })
    .max(30, { message: "El nombre del videjuego supera los 30 caracteres." }),
  description: z.string(),
  YoutubeUrl: z.string().optional(),
  RepoUrl: z.string().optional(),
  files: z.array(z.instanceof(File)).default([]),
  recaptcha: z
    .string()
    .min(1, { message: "La verificación de reCAPTCHA es obligatoria" }),
});

// Define CombinedFormValues with explicit types to match form expectations
export type CombinedFormValues = {
  teamName: string;
  members: {
    nombre: string;
    apellido: string;
    correo: string;
    codigoEstudiantil: string;
    nrc: string[];
  }[];
  gameName: string;
  description: string;
  YoutubeUrl: string;
  RepoUrl: string;
  files: File[];
  recaptcha: string;
};
