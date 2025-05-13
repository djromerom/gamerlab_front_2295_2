import { z } from "zod";

export const CombinedSchema = z.object({
  teamName: z.string().min(1, 'Requerido'),
  members: z
    .array(
      z.object({
        nombre: z.string().min(1, 'Requerido'),
        apellido: z.string().min(1, 'Requerido'),
        correo: z.string().email('Email inválido').endsWith("@uninorte.edu.co", "Debe ser un correo uninorte"),
        codigoEstudiantil: z.string().min(1, 'Requerido'),
        nrc: z.array(z.string().min(1, 'Requerido')).min(1, 'Selecciona al menos un NRC'),
      })
    )
    .min(1, 'Al menos un integrante')
    .max(5, 'Máximo 5 integrantes'),
  gameName: z.string().min(1, 'Requerido'),
  description: z.string().min(1, 'Requerido'),
  files: z
    .array(z.custom<File>())
    .min(1, 'Selecciona al menos un archivo')
    .max(1, 'Solo un archivo')
    .refine((files) => files.every((f) => f.size <= 5 * 1024 * 1024), {
      message: 'El archivo debe pesar menos de 5 MB',
    }),
  recaptcha: z.string(),
});

export type CombinedFormValues = z.infer<typeof CombinedSchema>;

