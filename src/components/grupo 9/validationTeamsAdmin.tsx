import { z } from "zod";

/* ────────────────────────────────────────────────────────────────────
   Validaciones y esquemas (extraído desde TeamWizardDialog)
──────────────────────────────────────────────────────────────────── */
export const isYouTubeUrl = (url: string) =>
  !url || /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/i.test(url);

export const uninorteEmail = (s: string) => /^[A-Z0-9._%+-]+@uninorte\.edu\.co$/i.test(s);
export const onlyDigits = (s: string) => /^\d+$/.test(s);

export const MemberSchemaAllRequired = z.object({
  id_integrante: z.number().optional(),
  nombre: z.string().trim().min(1, "Obligatorio"),
  apellido: z.string().trim().min(1, "Obligatorio"),
  correo: z.string().trim().min(1, "Obligatorio").email("Correo inválido"),
  codigo_estudiantil: z.string().trim().min(1, "Obligatorio"),
  nrcIds: z.array(z.number()).optional(),
});

export const WizardSchema = z.object({
  mode: z.enum(["add", "edit"]).optional(),
  id_equipo: z.number(),
  isExternal: z.boolean(),
  team_nrc_global_id: z.number().optional(),
  nombre_equipo: z.string().trim().min(1, "Nombre del equipo requerido"),
  videojuego: z.object({
    nombre: z.string().trim().min(1, "Nombre del videojuego requerido"),
    descripcion: z.string().trim().min(1, "Descripción requerida"),
    logo_url: z.string().url("URL inválida").or(z.literal("")).optional(),
    video_demo_url: z.string().trim().refine(isYouTubeUrl, "Enlace de YouTube inválido"),
    repo_url: z.string().trim().optional(),
  }),
  integrantes: z.array(MemberSchemaAllRequired).min(1, "Agrega al menos un miembro"),
}).superRefine((data, ctx) => {
  if (data.isExternal) {
    if (!data.team_nrc_global_id) {
      ctx.addIssue({ code: "custom", path: ["team_nrc_global_id"], message: "Selecciona el NRC global" });
    }
  } else {
    data.integrantes.forEach((m, i) => {
      if (!uninorteEmail(m.correo))
        ctx.addIssue({ code: "custom", path: ["integrantes", i, "correo"], message: "Debe ser @uninorte.edu.co" });
      if (!onlyDigits(m.codigo_estudiantil))
        ctx.addIssue({ code: "custom", path: ["integrantes", i, "codigo_estudiantil"], message: "Solo números" });
      if (!m.nrcIds || m.nrcIds.length === 0)
        ctx.addIssue({ code: "custom", path: ["integrantes", i, "nrcIds"], message: "Selecciona al menos un NRC" });
    });
  }
});

export type WizardValues = z.infer<typeof WizardSchema>;