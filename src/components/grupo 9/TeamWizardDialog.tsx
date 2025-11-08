import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Trash2, Plus, Pencil } from "lucide-react";
import type { NrcInfo, MateriaInfo, TeamRowData } from "./teams-utils";
import { uploadImage, getImageUrl } from "@/components/grupo 11/azureFile";

// Define an interface for your NRC option objects
interface NrcOption {
  code: number | string;
  name?: string;
  [key: string]: unknown;
}

type SafeNrc = {
  id: number;
  codeStr: string;
  label: string;
};

/* ────────────────────────────────────────────────────────────────────
   Validaciones y helpers
──────────────────────────────────────────────────────────────────── */
const isYouTubeUrl = (url: string) =>
  !url || /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/i.test(url);

const uninorteEmail = (s: string) => /^[A-Z0-9._%+-]+@uninorte\.edu\.co$/i.test(s);
const onlyDigits = (s: string) => /^\d+$/.test(s);

const MemberSchemaAllRequired = z.object({
  nombre: z.string().trim().min(1, "Obligatorio"),
  apellido: z.string().trim().min(1, "Obligatorio"),
  correo: z.string().trim().min(1, "Obligatorio").email("Correo inválido"),
  codigo_estudiantil: z.string().trim().min(1, "Obligatorio"),
  nrcIds: z.array(z.number()).optional(), // ✅ Cambio: array de números
});

const WizardSchema = z.object({
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
      // ✅ Validar que tenga al menos un NRC
      if (!m.nrcIds || m.nrcIds.length === 0)
        ctx.addIssue({ code: "custom", path: ["integrantes", i, "nrcIds"], message: "Selecciona al menos un NRC" });
    });
  }
});

export type WizardValues = z.infer<typeof WizardSchema>;

/* Error bajo campo */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

function StepHeader({
  step, total, title, cantidad, subtitle,
}: { step: number; total: number; title: string; cantidad?: number; subtitle?: string }) {
  return (
    <div className="mb-2">
      <div className="text-xs text-muted-foreground">Paso {step} de {total}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      {cantidad !== undefined && <h4 className="text-sm text-muted-foreground mb-1">Cantidad de miembros: {cantidad}</h4>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

async function checkGameNameUnique(apiBaseUrl: string, gameName: string) {
  const res = await fetch(`${apiBaseUrl}/teams/videogame/${encodeURIComponent(gameName)}`);
  if (!res.ok) throw new Error("No se pudo verificar el nombre del videojuego.");
  const exists = await res.json();
  return exists === true;
}

async function findUsedEmails(apiBaseUrl: string, emails: string[], excludeEmails: string[] = []) {
  const results: string[] = [];
  await Promise.all(
    emails.map(async (email) => {
      // Saltar emails que deben ser excluidos (ej: email original del líder en modo edición)
      if (excludeEmails.includes(email)) return;

      const res = await fetch(`${apiBaseUrl}/users/check-email?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.used) results.push(email);
      }
    })
  );
  return results;
}

async function uploadFilesToAzure(filesList: File[]) {
  if (!filesList || filesList.length === 0) return [] as string[];
  const id = toast.loading("Subiendo archivos...");
  try {
    const urls = await Promise.all(
      filesList.map(async (file) => {
        const up = await uploadImage(file);
        const url = await getImageUrl(up.id);
        return url.url;
      })
    );
    toast.success("Archivos subidos correctamente", { id });
    return urls;
  } catch (e: any) {
    toast.dismiss(id);
    throw new Error(e?.message || "Fallo al subir archivos");
  }
}

function buildPayload(
  data: WizardValues,
  uploadedUrls: string[],
  nrcOptions: NrcInfo[],
  primaryEmailLocked?: string
) {
  const globalNrcCode =
    data.isExternal && data.team_nrc_global_id
      ? nrcOptions.find(n => n.id_nrc === data.team_nrc_global_id)?.codigo
      : undefined;

  const members = data.integrantes.map((m, idx) => {
    const email = idx === 0 && primaryEmailLocked ? primaryEmailLocked : m.correo;

    if (data.isExternal) {
      return {
        memberFirstName: m.nombre,
        memberLastName: m.apellido,
        memberEmail: email,
        nrc: globalNrcCode ? [globalNrcCode] : [],
      };
    }

    // ✅ Mapear múltiples NRCs
    const nrcCodes = (m.nrcIds || [])
      .map(id => nrcOptions.find(n => n.id_nrc === id)?.codigo)
      .filter((code): code is number => code !== undefined);

    return {
      memberFirstName: m.nombre,
      memberLastName: m.apellido,
      memberEmail: email,
      studentCode: m.codigo_estudiantil,
      nrc: nrcCodes,
    };
  });

  return {
    teamName: data.nombre_equipo,
    members,
    videogame: {
      vgName: data.videojuego.nombre,
      description: data.videojuego.descripcion,
      logoURL: uploadedUrls[0] || data.videojuego.logo_url || "",
      videoDemoUrl: data.videojuego.video_demo_url || "",
    },
    isExternal: data.isExternal,
    teamNrcGlobal: data.isExternal ? (globalNrcCode ?? null) : null,
  };
}

/** Para abrir "Editar" desde la tabla */
export function toInitialValuesFromTeam(team: TeamRowData, isExternalGuess = false): WizardValues {
  return {
    id_equipo: team.id_equipo,
    mode: "edit",
    isExternal: (team as any).isExternal ?? isExternalGuess,
    // intentar preservar el id del NRC global si viene (puede ser id o código según backend)
    team_nrc_global_id: (team as any).team_nrc_global_id ?? (team as any).teamNrcGlobal ?? undefined,
    nombre_equipo: team.nombre_equipo,
    videojuego: {
      nombre: team.videojuego.nombre,
      descripcion: team.videojuego.descripcion,
      logo_url: team.videojuego.logo_url,
      video_demo_url: (team as any).videojuego?.video_demo_url || "",
    },
    integrantes: team.integrantes.map((m: any) => ({
      nombre: m.nombre || "",
      apellido: m.apellido || "",
      correo: m.correo || "",
      codigo_estudiantil: String(m.codigo_estudiantil ?? ""),
      // Mapear nrcs existentes a nrcIds (usar any porque integranted type no define nrcs)
      nrcIds: Array.isArray((m as any).nrcs) ? (m as any).nrcs.map((n: any) => n.id_nrc ?? n.id ?? n.code) : [],
    })),
  };
}

/* ────────────────────────────────────────────────────────────────────
   Wizard en 2 pasos (responsive + errores por campo)
──────────────────────────────────────────────────────────────────── */
export type TeamWizardDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  apiBaseUrl: string;
  nrcOptions: NrcInfo[];
  materiasOptions: MateriaInfo[];
  onSuccess: () => void;
  initialData?: Partial<WizardValues>;
};

export default function TeamWizardDialog({
  open,
  onOpenChange,
  apiBaseUrl,
  nrcOptions,
  onSuccess,
  initialData,
}: TeamWizardDialogProps) {
  // ✅ TODOS LOS ESTADOS DENTRO DEL COMPONENTE
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(0);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [nrcActivos, setNrcActivos] = useState<NrcOption[]>([]);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options`;

  // ✅ FETCH DE NRCs DENTRO DEL COMPONENTE
  useEffect(() => {
    const fetchNrcs = async () => {
      setIsPageLoading(true);
      try {
        const res = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          let errorMsg = `Error ${res.status}: Failed to fetch subjects`;
          try {
            const errorBody = await res.json();
            errorMsg = `Error ${res.status}: ${errorBody.message || errorMsg}`;
          } catch (e) {
            console.log(e);
          }
          throw new Error(errorMsg);
        }
        const apiResponseObject = await res.json();

        let nrcOptionsArray: NrcOption[] = [];

        if (
          typeof apiResponseObject === "object" &&
          apiResponseObject !== null &&
          Object.prototype.hasOwnProperty.call(apiResponseObject, "length")
        ) {
          const trueArray = Object.values(apiResponseObject);

          nrcOptionsArray = trueArray.filter(
            (item): item is NrcOption =>
              !!item && (item as NrcOption).code !== undefined && (item as NrcOption).code !== null
          );
        } else {
          console.warn(
            "API response for NRCs was not the expected array-like object:",
            apiResponseObject
          );
        }
        setNrcActivos(nrcOptionsArray);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setNrcActivos([]);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchNrcs();
  }, [API_ENDPOINT]);

  // ✅ USEMEMO DENTRO DEL COMPONENTE
  const safeNrcs: SafeNrc[] = useMemo(() => {
    const toNumber = (v: unknown) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = Number(v.trim());
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    };

    return (nrcActivos || [])
      .filter((o): o is NrcOption => !!o && o.code !== undefined && o.code !== null)
      .map((o) => {
        const id = toNumber(o.code);
        const codeStr = String(o.code);
        const label = o.name ? `${codeStr} - ${o.name}` : codeStr;
        return { id, codeStr, label };
      })
      .filter((x) => Number.isFinite(x.id));
  }, [nrcActivos]);

  const defaultValues: WizardValues = {
    mode: "add",
    id_equipo: 0,
    isExternal: false,
    team_nrc_global_id: undefined,
    nombre_equipo: "",
    videojuego: { nombre: "", descripcion: "", logo_url: "", video_demo_url: "" },
    integrantes: [{
      nombre: "",
      apellido: "",
      correo: "",
      codigo_estudiantil: "",
      nrcIds: [] // ✅ Cambio: array vacío
    }],
  };
  const methods = useForm<WizardValues>({
    resolver: zodResolver(WizardSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { control, watch, handleSubmit, reset, formState } = methods;
  const { errors } = formState;

  const { fields, append, remove } = useFieldArray({ control, name: "integrantes" });
  const mode = watch("mode");
  const isExternal = watch("isExternal");

  // Email del primer integrante bloqueado en edición
  const primaryEmailLocked = useMemo(() => {
    if (mode !== "edit") return undefined;
    const mem = watch("integrantes");
    return mem?.[0]?.correo || undefined;
  }, [mode, watch]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ ...defaultValues, ...initialData });
      } else {
        reset(defaultValues);
      }
      setStep(1);
      setFiles([]);
      setEditingIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Paso 1 → Paso 2 (validaciones de equipo+juego) */
  const nextFromStep1 = async () => {
    const vals = methods.getValues();

    // dispare validación de estos campos visibles
    await methods.trigger(["nombre_equipo", "videojuego.nombre", "videojuego.descripcion", "videojuego.video_demo_url"]);

    if (errors?.nombre_equipo || errors?.videojuego?.nombre || errors?.videojuego?.descripcion || errors?.videojuego?.video_demo_url) {
      return;
    }

    if (isExternal && !vals.team_nrc_global_id) {
      toast.error("Selecciona el NRC global para colegios");
      return;
    }

    if (files.length > 4) {
      toast.error("Máximo 4 archivos");
      return;
    }

    try {
      setBusy(true);
      const exists = await checkGameNameUnique(apiBaseUrl, vals.videojuego.nombre);
      if (exists && (mode !== "edit" || vals.videojuego.nombre !== (initialData?.videojuego?.nombre || ""))) {
        toast.error("El nombre del videojuego ya está en uso.");
        return;
      }
      setStep(2);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo verificar el nombre del videojuego");
    } finally {
      setBusy(false);
    }
  };

  /** Guardar (Paso 2) */
  const onSubmit = handleSubmit(async (data) => {
    setBusy(true);
    try {
      // Validación completa
      WizardSchema.parse(data);

      if (!data.isExternal && data.integrantes.length > 0) {
        const emails = data.integrantes.map((m: { correo: any; }) => m.correo);
        // ✅ En modo edición, excluir el email original del primer miembro
        const excludeEmails = data.mode === "edit" && primaryEmailLocked ? [primaryEmailLocked] : [];
        const dup = await findUsedEmails(apiBaseUrl, emails, excludeEmails);
        if (dup.length) {
          toast.error(`Correo(s) ya usados: ${dup.join(", ")}`);
          return;
        }
      }

      if (files.length > 4) throw new Error("Máximo 4 archivos");
      const uploadedUrls = files.length ? await uploadFilesToAzure(files) : [];

      const payload = buildPayload(data, uploadedUrls, nrcOptions, primaryEmailLocked);
      const url = data.mode === "add" ? `${apiBaseUrl}/teams` : `${apiBaseUrl}/teams/${data.id_equipo}`;
      const method = data.mode === "add" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!(data.mode === "add" ? res.status === 201 : res.ok)) {
        // Intentar parsear body con errores estructurados
        const errBody = await res.json().catch(() => ({}));

        // Si el backend devolvió errores por campo, mapearlos al formulario
        const maybeErrors = (errBody && (errBody.errors || errBody.message || errBody)) || null;
        let mapped = false;

        if (maybeErrors && typeof maybeErrors === "object") {
          // ej: { nombre_equipo: 'required', integrantes: { '0.correo': 'invalid' } }
          const assignError = (path: string, msg: string) => {
            try {
              // convertir paths con puntos a rutas para react-hook-form
              methods.setError(path as any, { type: "server", message: msg });
              mapped = true;
            } catch (e) {
              // ignore
            }
          };

          // Si viene message como string, mostrarlo
          if (typeof errBody.message === "string") {
            // no field-level errors, mostrar toast
            toast.error(errBody.message);
          } else {
            // recorrer keys y asignar
            const source = errBody.errors ?? errBody.message ?? errBody;
            if (typeof source === "object") {
              Object.entries(source).forEach(([k, v]) => {
                const msg = Array.isArray(v) ? v.join(", ") : String(v ?? "Error");
                // si la clave contiene índices como integrantes.0.correo, setear directamente
                assignError(k, msg);
              });
            }
          }
        }

        // Si no se mapeó a campos, arrojar con mensaje para el catch y mostrar toast
        const fallbackMsg = (errBody && (errBody.message || JSON.stringify(errBody))) || `Error ${res.status}`;
        if (!mapped) throw new Error(fallbackMsg);
        else throw new Error("Validation error");
      }

      toast.success(data.mode === "add" ? "Equipo registrado correctamente" : "Equipo actualizado correctamente");
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error("Error al guardar", { description: e?.message || "Error inesperado" });
    } finally {
      setBusy(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[92vw] sm:max-w-2xl">
        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{methods.watch("mode") === "add" ? "Registrar equipo" : "Editar equipo"}</DialogTitle>
            </DialogHeader>

            {/* indicador 2 pasos */}
            <div className="flex items-center gap-2 text-xs">
              {[1, 2].map((i) => (
                <div key={i} className={`h-1 rounded w-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>

            {/* PASO 1: Equipo + Videojuego */}
            {step === 1 && (
              <div className="space-y-4">
                <StepHeader step={1} total={2} title="Datos del equipo y del videojuego" />
                <div className="grid grid-cols-1 gap-3">
                  {/* Tipo de equipo */}
                  <div className="flex flex-col gap-1">
                    <Label>Tipo de equipo</Label>
                    <Select
                      value={isExternal ? "colegio" : "uninorte"}
                      onValueChange={(v) => methods.setValue("isExternal", v === "colegio")}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecciona el tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uninorte">Uninorte</SelectItem>
                        <SelectItem value="colegio">Colegio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Equipo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                    <div className="flex flex-col gap-1">
                    <Label>Nombre del equipo</Label>
                    <Input
                      {...methods.register("nombre_equipo")}
                      aria-invalid={!!errors?.nombre_equipo}
                      placeholder="Ej: Pixel Ninjas"
                    />
                    <FieldError message={(errors as any)?.nombre_equipo?.message} />
                    </div>

                    {/* Videojuego */}
                    <div className="flex flex-col gap-1">
                      <Label>Nombre del videojuego</Label>
                      <Input
                        {...methods.register("videojuego.nombre")}
                        aria-invalid={!!errors?.videojuego?.nombre}
                        placeholder="Ej: Cyber Runner"
                      />
                      <FieldError message={(errors as any)?.videojuego?.nombre?.message} />
                    </div>

                  </div>

                  {/* NRC global si colegio */}
                  {isExternal && (
                    <div className="flex flex-col gap-1">
                      <Label>NRC (global equipo)</Label>
                      <Select
                        value={(() => {
                          const v = methods.watch("team_nrc_global_id");
                          return typeof v === "number" ? String(v) : "";
                        })()}
                        onValueChange={(value) => methods.setValue("team_nrc_global_id", parseInt(value, 10))}
                        disabled={isPageLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isPageLoading
                              ? "Cargando NRCs..."
                              : safeNrcs.length
                                ? "Selecciona un NRC"
                                : "No hay NRCs disponibles"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {safeNrcs.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              {isPageLoading ? "Cargando..." : "No hay NRCs disponibles."}
                            </div>
                          ) : (
                            safeNrcs.map((n) => (
                              <SelectItem key={n.id} value={String(n.id)}>
                                {n.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FieldError message={(errors as any)?.team_nrc_global_id?.message} />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <Label>Descripción</Label>
                    <textarea
                      className="p-2 border rounded-md"
                      rows={4}
                      {...methods.register("videojuego.descripcion")}
                      aria-invalid={!!errors?.videojuego?.descripcion}
                      placeholder="Breve descripción del juego…"
                    />
                    <FieldError message={(errors as any)?.videojuego?.descripcion?.message} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label>Video demo (YouTube) – opcional</Label>
                    <Input
                      placeholder="https://youtu.be/..."
                      {...methods.register("videojuego.video_demo_url")}
                      aria-invalid={!!errors?.videojuego?.video_demo_url}
                    />
                    <FieldError message={(errors as any)?.videojuego?.video_demo_url?.message} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label>Archivos (opcional, máximo 4)</Label>
                    <Input
                      type="file"
                      multiple={true} // 👈 asegúrate de pasarlo explícitamente
                      accept="image/*,video/*" // opcional: restringe tipos
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        const combined = [...files, ...newFiles];
                        if (combined.length > 4) {
                          toast.error("Máximo 4 archivos");
                          return;
                        }
                        setFiles(combined);
                      }}
                    />
                    <div className="text-xs text-muted-foreground">
                      {files.length
                        ? `${files.length} archivo(s) seleccionados`
                        : "Puedes subir hasta 4 archivos"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: Miembros (una tarjeta abierta a la vez) */}
            {step === 2 && (
              <div className="space-y-4">
                <StepHeader
                  step={2}
                  total={2}
                  title="Miembros"
                  cantidad={fields.length}
                  subtitle={
                    isExternal
                      ? "Colegio: el NRC se tomó del paso 1"
                      : "Uninorte: correo @uninorte.edu.co y NRC obligatorio por miembro"
                  }
                />

                {/* Contenedor con scroll si hay más de 4 miembros */}
                <div className={`space-y-3 ${fields.length > 4 ? "max-h-[420px] overflow-y-auto pr-2" : ""}`}>
                  {fields.map((f, idx) => {
                    const isOpen = editingIndex === idx;
                    const member = methods.getValues(`integrantes.${idx}`);
                    const memErrors = (errors as any)?.integrantes?.[idx] || {};

                    return (
                      <div key={f.id} className="rounded-md border bg-background">
                        {/* Header compacto */}
                        <div className="flex items-center justify-between p-3">
                          <div className="text-sm">
                            <div className="font-medium flex items-center gap-2">
                              <span className="mr-2 text-muted-foreground">Miembro Nº {idx + 1}</span>
                              {member?.nombre || "—"} {member?.apellido || ""}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member?.correo || "correo no definido"}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={isOpen ? "secondary" : "outline"}
                              onClick={() => setEditingIndex(isOpen ? null : idx)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              {isOpen ? "Cerrar" : "Editar"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                remove(idx);
                                setEditingIndex((prev) => {
                                  if (prev === null) return null;
                                  if (prev === idx) return null;
                                  return prev > idx ? prev - 1 : prev;
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Quitar
                            </Button>
                          </div>
                        </div>

                        {/* Formulario del miembro (solo si está abierto) */}
                        {isOpen && (
                          <div className="p-3 pt-0 space-y-2">
                            {/* Nombre + Apellido (responsive) */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex flex-col gap-1 sm:w-1/2">
                                <Label>Nombre</Label>
                                <Input
                                  {...methods.register(`integrantes.${idx}.nombre` as const)}
                                  aria-invalid={!!memErrors?.nombre}
                                />
                                <FieldError message={memErrors?.nombre?.message} />
                              </div>
                              <div className="flex flex-col gap-1 sm:w-1/2">
                                <Label>Apellido</Label>
                                <Input
                                  {...methods.register(`integrantes.${idx}.apellido` as const)}
                                  aria-invalid={!!memErrors?.apellido}
                                />
                                <FieldError message={memErrors?.apellido?.message} />
                              </div>
                            </div>

                            {/* Correo + Código en la misma línea */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex flex-col gap-1 sm:w-2/3">
                                <Label>
                                  Correo{" "}
                                  {methods.watch("mode") === "edit" && idx === 0 ? "(bloqueado)" : ""}
                                </Label>
                                <Input
                                  {...methods.register(`integrantes.${idx}.correo` as const)}
                                  disabled={methods.watch("mode") === "edit" && idx === 0}
                                  aria-invalid={!!memErrors?.correo}
                                  placeholder={isExternal ? "cualquier correo válido" : "usuario@uninorte.edu.co"}
                                />
                                <FieldError message={memErrors?.correo?.message} />
                              </div>
                              {!isExternal && (
                                <div className="flex flex-col gap-1 sm:w-1/3">
                                  <Label>Código Estudiantil</Label>
                                  <Input
                                    {...methods.register(`integrantes.${idx}.codigo_estudiantil` as const)}
                                    aria-invalid={!!memErrors?.codigo_estudiantil}
                                    inputMode="numeric"
                                    placeholder="1234567890"
                                    onInput={(e) => {
                                      const input = e.currentTarget;
                                      input.value = input.value.replace(/\D/g, "");
                                    }}
                                  />
                                  <FieldError message={memErrors?.codigo_estudiantil?.message} />
                                </div>
                              )}
                            </div>

                            {/* ✅ NRC SELECTOR CORREGIDO - Solo para Uninorte */}
                            {!isExternal && (
                              <div className="flex flex-col gap-1">
                                <Label>NRCs del estudiante</Label>

                                {/* Selector de NRC */}
                                <Select
                                  onValueChange={(selectedCode) => {
                                    if (!selectedCode) return;

                                    const currentNrcIds = member.nrcIds || [];
                                    const selectedNrcId = safeNrcs.find(n => n.codeStr === selectedCode)?.id;

                                    // Evitar duplicados
                                    if (selectedNrcId && !currentNrcIds.includes(selectedNrcId)) {
                                      methods.setValue(
                                        `integrantes.${idx}.nrcIds`,
                                        [...currentNrcIds, selectedNrcId]
                                      );
                                    }
                                  }}
                                  disabled={isPageLoading}
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        isPageLoading
                                          ? "Cargando NRCs..."
                                          : safeNrcs.length
                                            ? "Selecciona NRCs"
                                            : "No hay NRCs disponibles"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {safeNrcs.length === 0 ? (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        {isPageLoading ? "Cargando..." : "No hay NRCs disponibles."}
                                      </div>
                                    ) : (
                                      safeNrcs
                                        // ✅ Filtrar NRCs ya seleccionados
                                        .filter(n => !(member.nrcIds || []).includes(n.id))
                                        .map((n) => (
                                          <SelectItem key={n.id} value={n.codeStr}>
                                            {n.label}
                                          </SelectItem>
                                        ))
                                    )}
                                  </SelectContent>
                                </Select>

                                {/* Chips de NRCs seleccionados */}
                                {member.nrcIds && member.nrcIds.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {member.nrcIds.map((nrcId) => {
                                      const nrcInfo = safeNrcs.find(n => n.id === nrcId);
                                      if (!nrcInfo) return null;

                                      return (
                                        <div
                                          key={nrcId}
                                          className="flex items-center space-x-1 rounded-full border border-input bg-muted px-3 py-1 text-sm hover:bg-muted/70 transition"
                                        >
                                          <span>{nrcInfo.codeStr}</span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 p-0 text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                              const currentIds = member.nrcIds || [];
                                              methods.setValue(
                                                `integrantes.${idx}.nrcIds`,
                                                currentIds.filter((id) => id !== nrcId)
                                              );
                                            }}
                                          >
                                            ✕
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                <FieldError message={memErrors?.nrcIds?.message} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Botón agregar miembro */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (fields.length >= 10) {
                        toast.error("Máximo 10 miembros por equipo");
                        return;
                      }
                      const newIdx = fields.length;
                      append({
                        nombre: "",
                        apellido: "",
                        correo: "",
                        codigo_estudiantil: "",
                        nrcIds: [],
                      });
                      setTimeout(() => setEditingIndex(newIdx), 0);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Agregar miembro
                  </Button>

                  {/* Error global si no hay miembros */}
                  <FieldError message={(errors as any)?.integrantes?.message} />
                </div>
              </div>
            )}

            <DialogFooter className="mt-2">
              <div className="flex w-full justify-between">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                  Cancelar
                </Button>
                <div className="space-x-2">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
                    </Button>
                  )}
                  {step === 1 ? (
                    <Button type="button" onClick={nextFromStep1} disabled={busy}>
                      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={busy} onClick={() => onSubmit()}>
                      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {methods.watch("mode") === "add" ? "Registrar" : "Guardar cambios"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}