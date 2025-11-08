import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { WizardSchema, WizardValues} from "./validationTeamsAdmin";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Trash2, Plus, Pencil, CloudUpload, X } from "lucide-react";
import { ImageCropper } from "@/components/grupo 11/ImageCropper";
import type { NrcInfo, MateriaInfo, TeamRowData, NrcOption, SafeNrc, UploadInfo } from "./teams-utils";
import { uploadImage, getImageUrl } from "@/components/grupo 11/azureFile";

// FieldError component for displaying validation errors
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

/* ────────────────────────────────────────────────────────────────────
   Fetch de Nombre de Juego unico y correo no registrado
──────────────────────────────────────────────────────────────────── */

async function checkGameNameUnique(apiBaseUrl: string, gameName: string) {
  const res = await fetch(`${apiBaseUrl}/teams/videogame/${encodeURIComponent(gameName)}`);
  if (!res.ok) throw new Error("No se pudo verificar el nombre del videojuego.");
  const exists = await res.json();
  return exists === true;
}

async function findUsedEmails(apiBaseUrl: string, emails: string[], excludeEmails: string[] = []) {

  const toCheck = (emails || [])
    .map(e => (e || "").trim())
    .filter(e => e && !excludeEmails.includes(e));

  if (toCheck.length === 0) return [];

  try {
    const url = `${apiBaseUrl.replace(/\/$/, "")}/teams/validate-emails`;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: toCheck }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      console.warn("[findUsedEmails] validate-emails failed:", url, res.status, body);
      return [];
    }

    const data = await res.json().catch(() => null);

    if (Array.isArray(data)) {
      return data.map(String);
    }
    if (data && typeof data === "object") {
      return Object.entries(data)
        .filter(([, used]) => !!used)
        .map(([email]) => email);
    }

    return [];
  } catch (err) {
    console.error("[findUsedEmails] network error:", err);
    return [];
  }
}

async function uploadFilesToAzure(filesList: File[]) {
  if (!filesList || filesList.length === 0) return [] as UploadInfo[];
  const id = toast.loading("Subiendo archivos...");
  try {
    const uploads = await Promise.all(
      filesList.map(async (file) => {
        const up = await uploadImage(file);
        const urlObj = await getImageUrl(up.id).catch(() => ({ url: "" }));
        const url = urlObj?.url ?? "";
        // devolver metadata mínima requerida por el backend
        return {
          blobName: url,
          filename: file.name,
          mimetype: file.type || "application/octet-stream",
          size: file.size || 0,
          isPublic: true,
          url,
        } as UploadInfo;
      })
    );
    toast.success("Archivos subidos correctamente", { id });
    return uploads;
  } catch (e: any) {
    toast.dismiss(id);
    throw new Error(e?.message || "Fallo al subir archivos");
  }
}

function buildPayload(
  data: WizardValues,
  logoUpload: UploadInfo | null,
  galleryUploads: UploadInfo[],
  nrcOptions: NrcInfo[],
  primaryEmailLocked?: string
) {
  // helper para generar códigos estudiantiles únicos por llamada (>400000000)
  const makeRandomStudentCode = (() => {
    const used = new Set<string>();
    return () => {
      let n: number;
      do {
        n = 400000000 + Math.floor(Math.random() * 500000000); // rango 400000000..899999999
      } while (used.has(String(n)));
      used.add(String(n));
      return String(n);
    };
  })();

  // resolver código del NRC de forma robusta
  const resolveNrcCode = (item: any) => {
    if (!item) return undefined;
    return (
      item.codigo ??
      item.code ??
      item.codeStr ??
      item.id_nrc ??
      item.id ??
      ""
    ).toString();
  };

  const findNrcMatch = (value: any) => {
    if (value === undefined || value === null) return undefined;
    const vStr = String(value).toLowerCase();
    return (nrcOptions || []).find((n: any) => {
      const candidates = [
        n?.id_nrc,
        n?.id,
        n?.code,
        n?.codigo,
        n?.codeStr,
      ].map((c: any) => (c === undefined || c === null ? "" : String(c).toLowerCase()));
      return candidates.includes(vStr);
    });
  };

  // si es externo, resolver el "código" del NRC global y usarlo por miembro
  const globalNrcCode =
    data.isExternal && data.team_nrc_global_id
      ? (() => {
          const match = findNrcMatch(data.team_nrc_global_id);
          return match ? resolveNrcCode(match) : String(data.team_nrc_global_id);
        })()
      : undefined;

  const members = (data.integrantes || []).map((m, idx) => {
    const email = idx === 0 && primaryEmailLocked ? primaryEmailLocked : m.correo;

    const nrcStrings = data.isExternal
      // para equipos externos: asignar el NRC global a cada miembro
      ? (globalNrcCode ? [String(globalNrcCode)] : [])
      : (m.nrcIds || [])
          .map((id) => {
            const idStr = String(id);
            const match = (nrcOptions || []).find((n: any) =>
              String(n.id_nrc ?? n.id ?? n.code ?? n.codigo ?? n.codeStr ?? "").toLowerCase() === idStr.toLowerCase()
            );
            if (match) return resolveNrcCode(match);
            return idStr;
          })
          .filter((c) => c !== undefined && c !== null)
          .map(String);

    const memberObj: Record<string, any> = {
      memberFirstName: m.nombre,
      memberLastName: m.apellido,
      memberEmail: email,
      nrc: nrcStrings,
    };

    // Siempre enviar studentCode. Si no viene y es externo, generar uno único y >400000000
    if (m.codigo_estudiantil && String(m.codigo_estudiantil).trim() !== "") {
      memberObj.studentCode = String(m.codigo_estudiantil);
    } else {
      // generar código para externos / cuando no exista
      memberObj.studentCode = data.isExternal ? makeRandomStudentCode() : String(m.codigo_estudiantil ?? "");
    }

    return memberObj;
  });

  const uploads = (galleryUploads || []).map(u => ({
    blobName: u.blobName,
    filename: u.filename,
    mimetype: u.mimetype,
    size: u.size,
    isPublic: u.isPublic,
  }));

  return {
    teamName: data.nombre_equipo,
    isExternal: data.isExternal,
    // NOTA: no incluir team_nrc_global_id porque el backend no lo consume;
    // en su lugar cada miembro ya lleva su nrc (global cuando isExternal=true)
    members,
    videogame: {
      vgName: data.videojuego.nombre,
      description: data.videojuego.descripcion,
      repoUrl: (data as any).videojuego?.repo_url || "",
      logoUrl: logoUpload?.blobName || data.videojuego.logo_url || "",
      videoUrl: data.videojuego.video_demo_url || "",
      uploads,
    },
  };
}

/** Para abrir "Editar" desde la tabla */
export function toInitialValuesFromTeam(team: TeamRowData, isExternalGuess = false): WizardValues {
  return {
    id_equipo: team.id_equipo,
    mode: "edit",
    isExternal: (team as any).isExternal ?? isExternalGuess,
    team_nrc_global_id: (team as any).team_nrc_global_id ?? (team as any).teamNrcGlobal ?? undefined,
    nombre_equipo: team.nombre_equipo,
    videojuego: {
      nombre: team.videojuego.nombre,
      descripcion: team.videojuego.descripcion,
      logo_url: team.videojuego.logo_url,
      video_demo_url: (team as any).videojuego?.video_demo_url || "",
    },
    integrantes: team.integrantes.map((m: any) => ({
      id_integrante: m.id_integrante ?? m.id ?? undefined, // ✅ conservar id del integrante
      nombre: m.nombre || "",
      apellido: m.apellido || "",
      correo: m.correo || "",
      codigo_estudiantil: String(m.codigo_estudiantil ?? ""),
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

function StepHeader({
  step,
  total,
  title,
  cantidad,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  cantidad?: number;
  subtitle?: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{`Paso ${step} de ${total}`}</span>
        <span className="text-muted-foreground">|</span>
        <span>{title}</span>
        {typeof cantidad === "number" && (
          <span className="ml-2 text-xs text-muted-foreground">{`(${cantidad})`}</span>
        )}
      </div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

export default function TeamWizardDialog({
  open,
  onOpenChange,
  apiBaseUrl,
  nrcOptions,
  onSuccess,
  initialData,
}: TeamWizardDialogProps) {
  //ESTADOS DENTRO DEL COMPONENTE
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(0);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [nrcActivos, setNrcActivos] = useState<NrcOption[]>([]);

  // Refs & cropper state for logo
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options`;

  //FETCH DE NRCs DENTRO DEL COMPONENTE
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
      id_integrante: undefined,
      nombre: "",
      apellido: "",
      correo: "",
      codigo_estudiantil: "",
      nrcIds: []
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
      setGalleryFiles([]);
      setLogoFile(null);
      setEditingIndex(0);
    }
  }, [open]);

  /** Paso 1 → Paso 2 (validaciones de equipo+juego) */
  const nextFromStep1 = async () => {
    const vals = methods.getValues();

    await methods.trigger(["nombre_equipo", "videojuego.nombre", "videojuego.descripcion"]);

    if (errors?.nombre_equipo || errors?.videojuego?.nombre || errors?.videojuego?.descripcion) {
      return;
    }

    if (isExternal && !vals.team_nrc_global_id) {
      toast.error("Selecciona el NRC global para colegios");
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

  /** Paso 2 → Paso 3 (validar integrantes) */
  const nextFromStep2 = async () => {
    await methods.trigger(["integrantes"]);
    const vals = methods.getValues();
    if ((errors as any)?.integrantes) return;
    if (!vals.integrantes || vals.integrantes.length === 0) {
      toast.error("Agrega al menos un miembro");
      return;
    }
    setStep(3);
  };

  // Logo handlers
  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const MAX_BYTES = 5 * 1024 * 1024;
    if (f.size > MAX_BYTES) {
      toast.error("La imagen debe pesar menos de 5 MB");
      e.target.value = "";
      return;
    }
    setSelectedLogoFile(f);
    setCropperOpen(true);
    e.target.value = "";
  };

  const handleCroppedLogo = (file: File) => {
    setLogoFile(file);
  };

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const u = URL.createObjectURL(logoFile);
    setLogoPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [logoFile]);

  // Gallery handlers & previews
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    const MAX_BYTES = 5 * 1024 * 1024;
    for (const f of newFiles) {
      if (!f.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        e.target.value = "";
        return;
      }
      if (f.size > MAX_BYTES) {
        toast.error("Cada imagen debe ser menor a 5 MB");
        e.target.value = "";
        return;
      }
    }

    const combined = [...galleryFiles, ...newFiles];
    if (combined.length > 5) {
      toast.error("Máximo 5 imágenes");
      e.target.value = "";
      return;
    }

    setGalleryFiles(combined);
    e.target.value = "";
  };

  const handleDeleteGallery = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    // revoke previous urls automatically by recreating
    const urls = galleryFiles.map((f) => URL.createObjectURL(f));
    setGalleryPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryFiles]);

  /** Guardar (Paso 2) */
  const onSubmit = handleSubmit(async (data) => {
    setBusy(true);
    try {
      // Validación completa
      WizardSchema.parse(data);

      if (!data.isExternal && data.integrantes.length > 0) {
        const emails = data.integrantes.map((m: { correo: any; }) => (m.correo || "").trim());

        // En modo edición: excluir los emails que pertenecen a los integrantes originales
        // y que NO fueron modificados (se compara por id_integrante cuando exista, y por posición como fallback).
        let excludeEmails: string[] = [];

        if (data.mode === "edit" && initialData?.integrantes) {
          // Mapear originales por id (si existe) y por índice
          const origById = new Map<number | string, string>();
          (initialData.integrantes || []).forEach((m: any) => {
            const id = m?.id_integrante ?? m?.id;
            if (id != null) origById.set(id, (m.correo || "").trim());
          });

          // Si el miembro actual tiene id y el correo no cambió, excluirlo
          data.integrantes.forEach((m: any, idx: number) => {
            const id = m?.id_integrante ?? m?.id;
            const curEmail = (m?.correo || "").trim();
            if (id != null && origById.get(id) === curEmail) {
              excludeEmails.push(curEmail);
            } else {
              // fallback por posición: si el correo en initialData en la misma posición coincide, excluirlo
              const origAtPos = (initialData.integrantes?.[idx]?.correo || "").trim();
              if (origAtPos && origAtPos === curEmail) excludeEmails.push(curEmail);
            }
          });

          // asegurar unicidad
          excludeEmails = Array.from(new Set(excludeEmails));
        } else {
          // en modo add no excluir nada
          excludeEmails = [];
        }

        const dup = await findUsedEmails(apiBaseUrl, emails, excludeEmails);
        if (dup.length) {
          toast.error(`Correo(s) ya usados: ${dup.join(", ")}`);
          return;
        }
      }

      // Subir logo (si existe) y galería (si existen)
      let logoUpload: UploadInfo | null = null;
      if (logoFile) {
        const [logoMeta] = await uploadFilesToAzure([logoFile]);
        logoUpload = logoMeta || null;
      }

      let galleryUploads: UploadInfo[] = [];
      if (galleryFiles.length) {
        if (galleryFiles.length > 5) throw new Error("Máximo 5 imágenes");
        galleryUploads = await uploadFilesToAzure(galleryFiles);
      }

      // payload completo (para POST) generado por tu helper
      const fullPayload = buildPayload(data, logoUpload, galleryUploads, nrcOptions, primaryEmailLocked);

      const url = data.mode === "add" ? `${apiBaseUrl}/teams` : `${apiBaseUrl}/teams/${data.id_equipo}`;
      const method = data.mode === "add" ? "POST" : "PATCH";

      // Si es update, construir un payload reducido según cambios detectados
      let requestBody: any = fullPayload;
      if (method === "PATCH") {
        // Construir PATCH con solo campos modificados
        const patch: any = {};

        // Helper simple de comparación
        const changed = (a: any, b: any) => {
          try {
            return JSON.stringify(a) !== JSON.stringify(b);
          } catch {
            return a !== b;
          }
        };

        const origTeamName = initialData?.nombre_equipo ?? "";
        if (changed(fullPayload.teamName, origTeamName)) patch.teamName = fullPayload.teamName;

        const origIsExternal = initialData?.isExternal ?? false;
        if (changed(fullPayload.isExternal, origIsExternal)) patch.isExternal = fullPayload.isExternal;
        const origGlobalNrc = initialData?.team_nrc_global_id ?? undefined;
        if (changed((fullPayload as any).team_nrc_global_id, origGlobalNrc)) patch.team_nrc_global_id = (fullPayload as any).team_nrc_global_id;

        const vgPatch: any = {};
        const origVg = {
          nombre: "",
          descripcion: "",
          repo_url: "",
          logo_url: "",
          video_demo_url: "",
          ...(initialData?.videojuego || {})
        };
        const curVg = (fullPayload as any).videogame || {};
        if (changed(curVg.vgName, origVg.nombre)) vgPatch.vgName = curVg.vgName;
        if (changed(curVg.description, origVg.descripcion)) vgPatch.description = curVg.description;
        if (changed(curVg.repoUrl, origVg.repo_url)) vgPatch.repoUrl = curVg.repoUrl;
        if (changed(curVg.logoUrl, origVg.logo_url)) vgPatch.logoUrl = curVg.logoUrl;
        if (changed(curVg.videoUrl, origVg.video_demo_url)) vgPatch.videoUrl = curVg.videoUrl;
        if ((galleryUploads?.length || 0) > 0) {
          vgPatch.uploads = galleryUploads.map(() => ({}));
        }
        if (Object.keys(vgPatch).length) patch.videogame = vgPatch;

        // 4) members: detect changes per integrante (existing, updated, new)
        const membersPatch: any[] = [];
        const origMembers = initialData?.integrantes || [];
        const curMembers = data.integrantes || [];

        // NRC global para colegios (si aplica) — usado para new/changed members en PATCH
        const globalNrcCodeForPatch =
          data.isExternal && data.team_nrc_global_id
            ? String((nrcOptions.find((n: any) => n.id_nrc === data.team_nrc_global_id)?.codigo) ?? "")
            : undefined;

        // track orig ids present to detect removals
        const origIdsSet = new Set<number | string>(origMembers.map((m: any) => m?.id_integrante ?? m?.id).filter(Boolean));
        const curIdsSet = new Set<number | string>();

        for (let idx = 0; idx < curMembers.length; idx++) {
          const cur = curMembers[idx];
          const orig = origMembers[idx] || null;
          const id = cur?.id_integrante ?? orig?.id_integrante;
          if (id == null && (!orig || orig == null)) {
            // Si es externo, asignar el NRC global a cada miembro; si no, usar nrcIds seleccionados
            const newMember: any = {
              memberFirstName: cur.nombre,
              memberLastName: cur.apellido,
              memberEmail: cur.correo,
              nrc: data.isExternal
                ? (globalNrcCodeForPatch ? [String(globalNrcCodeForPatch)] : [])
                : (cur.nrcIds || []).map((nid: number) => {
                    const n = nrcOptions.find(nrc => nrc.id_nrc === nid) || nrcOptions.find(nrc => String(nrc.codigo) === String(nid));
                    return n ? String((n as any).codigo ?? (n as any).code) : String(nid);
                  }),
            };
            if (!data.isExternal) newMember.studentCode = cur.codigo_estudiantil;
            membersPatch.push(newMember);
            continue;
          }

          if (id != null) {
            const changedMember: any = { id };
            const origEmail = (orig?.correo || "").trim();
            const curEmail = (cur?.correo || "").trim();
            if (changed(curEmail, origEmail)) changedMember.memberEmail = curEmail;

            const origFirst = (orig?.nombre || "");
            if (changed(cur?.nombre || "", origFirst)) changedMember.memberFirstName = cur.nombre;
            const origLast = (orig?.apellido || "");
            if (changed(cur?.apellido || "", origLast)) changedMember.memberLastName = cur.apellido;
            if (!data.isExternal) {
              const origCode = String(orig?.codigo_estudiantil ?? "");
              if (changed(cur?.codigo_estudiantil ?? "", origCode)) changedMember.studentCode = cur.codigo_estudiantil;
            }
            // nrcs compare
            const origNrcs = Array.isArray(orig?.nrcIds) ? orig.nrcIds.map(String) : (Array.isArray((orig as any).nrcs) ? (orig as any).nrcs.map((n: any) => String(n.id_nrc ?? n.id ?? n.code)) : []);
            const curNrcs = (cur?.nrcIds || []).map(String);
            if (data.isExternal) {
              // para equipos externos, siempre usar el NRC global (si existe)
              const globalArr = globalNrcCodeForPatch ? [String(globalNrcCodeForPatch)] : [];
              if (changed(origNrcs, globalArr)) {
                changedMember.nrc = globalArr;
              }
            } else {
              if (changed(origNrcs, curNrcs)) {
                changedMember.nrc = curNrcs;
              }
            }

            if (Object.keys(changedMember).length > 1) membersPatch.push(changedMember);
          }
        }

        const removedIds = Array.from(origIdsSet).filter(id => !curIdsSet.has(id));
        if (membersPatch.length) patch.members = membersPatch;
        if (removedIds.length) patch.removedMemberIds = removedIds;

        if (Object.keys(patch).length === 0) {
          toast.info("No hay cambios para guardar");
          setBusy(false);
          return;
        }

        requestBody = patch;
      }

      console.log("Submitting teams payload:", { url, method, payload: requestBody });

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!(data.mode === "add" ? res.status === 201 : res.ok)) {
        const errBody = await res.json().catch(() => ({}));
        let mapped = false;
        const assignError = (path: string, msg: string) => {
          try {
            methods.setError(path as any, { type: "server", message: msg });
            mapped = true;
          } catch (e) {
          }
        };

        const source = errBody.errors ?? (typeof errBody.message === "object" ? errBody.message : errBody);

        if (source && typeof source === "object") {
          Object.entries(source).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v.join(", ") : (typeof v === "string" ? v : JSON.stringify(v));
            const normalizedKey = k.replace(/\[(\d+)\]/g, '.$1');
            assignError(normalizedKey, msg);
          });
        }

        if (!mapped && typeof errBody.message === "string") {
          const shortMsg = errBody.message.length > 250 ? errBody.message.slice(0, 250) + "..." : errBody.message;
          throw new Error(shortMsg);
        }

        if (mapped) {
          toast.error("Corrige los errores en el formulario");
          return;
        }

        const fallbackRaw = JSON.stringify(errBody) || `Error ${res.status}`;
        const fallback = fallbackRaw.length > 300 ? fallbackRaw.slice(0, 300) + "..." : fallbackRaw;
        throw new Error(fallback);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (step === 3) {
      await onSubmit();
    } else if (step === 1) {
      await nextFromStep1();
    } else if (step === 2) {
      await nextFromStep2();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[92vw] sm:max-w-2xl">
        <FormProvider {...methods}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{methods.watch("mode") === "add" ? "Registrar equipo" : "Editar equipo"}</DialogTitle>
            </DialogHeader>

            {/* indicador 3 pasos */}
            <div className="flex items-center gap-2 text-xs">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1 rounded w-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>

            {/* PASO 1: Equipo + Videojuego */}
            {step === 1 && (
              <div className="space-y-4">
                <StepHeader step={1} total={3} title="Datos del equipo y del videojuego" />
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
                    <Label>Logo (opcional)</Label>
                    <div className="flex flex-col md:flex-row items-start gap-3">
                      <div
                        className="flex flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors hover:bg-muted/50 cursor-pointer w-full md:w-1/3"
                        onClick={() => logoInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") logoInputRef.current?.click();
                        }}
                      >
                        <CloudUpload className="h-8 w-8 mb-2 text-gray-400" />
                        <p className="text-center text-sm text-gray-600">Haz clic para seleccionar una imagen</p>
                        <p className="text-xs text-gray-400 mt-1">Máximo 5 MB • PNG, JPG, JPEG</p>
                        <Input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoInputChange}
                          className="hidden"
                        />
                      </div>

                      <div className="flex-1">
                        {logoPreview ? (
                          <div className="relative inline-block w-30 sm:w-32 md:w-32">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="rounded-md border object-cover w-full h-full"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => setLogoFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No hay logo seleccionado.</p>
                        )}

                        <div className="text-xs text-muted-foreground mt-2">Se abrirá un recortador para ajustar a 1:1</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: Enlaces y galería */}
            {step === 3 && (
              <div className="space-y-4">
                <StepHeader step={3} total={3} title="Repositorio y Material Multimedia" />
                <div className="grid grid-cols-1 gap-3">

                  <div className="flex flex-col gap-1">
                    <Label>URL del Repositorio (opcional)</Label>
                    <Input
                      placeholder="https://github.com/usuario/proyecto"
                      {...methods.register("videojuego.repo_url")}
                      aria-invalid={false}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label>Fotos del Proyecto (opcional)</Label>
                    <div className="space-y-3">
                      <div
                        className="flex items-center gap-3"
                      >
                        <div
                          className="flex items-center justify-center rounded-md border border-dashed p-4 cursor-pointer"
                          onClick={() => galleryInputRef.current?.click()}
                        >
                          <CloudUpload className="h-6 w-6 text-gray-400" />
                          <p className="ml-2 text-sm text-muted-foreground">Sube hasta 5 imágenes</p>
                          <Input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryChange}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {galleryPreviews.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {galleryPreviews.map((src, idx) => (
                            <div key={`${src}-${idx}`} className="relative group">
                              <div className="aspect-[6/3] overflow-hidden rounded-lg border">
                                <img src={src} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteGallery(idx)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No hay fotos seleccionadas.</p>
                      )}
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
                  total={3}
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

                            {/* Solo para Uninorte */}
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

            {/* Image cropper modal for logo */}
            <ImageCropper file={selectedLogoFile} open={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={handleCroppedLogo} />

            <DialogFooter className="mt-2">
              <div className="flex w-full justify-between">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                  Cancelar
                </Button>
                <div className="space-x-2">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={busy}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
                    </Button>
                  )}
                  {step === 1 ? (
                    <Button type="button" onClick={nextFromStep1} disabled={busy}>
                      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : step === 2 ? (
                    <Button type="button" onClick={nextFromStep2} disabled={busy}>
                      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={busy}>
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