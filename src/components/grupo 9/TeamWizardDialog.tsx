import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { WizardSchema, WizardValues } from "./validationTeamsAdmin";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { NrcInfo, MateriaInfo, TeamRowData, NrcOption, SafeNrc, UploadInfo } from "./teams-utils";
import { uploadImage, getImageUrl } from "@/components/grupo 11/azureFile";
import { submitTeam, SubmitCtx } from "./submitTeamsAdmin";
import TeamWizardForm from "./TeamWizardForm";

/* ────────────────────────────────────────────────────────────────────
   Fetch de Nombre de Juego unico y correo no registrado
──────────────────────────────────────────────────────────────────── */

async function checkGameNameUnique(apiBaseUrl: string, gameName: string) {
  const res = await fetch(`${apiBaseUrl}/teams/videogame/${encodeURIComponent(gameName)}`);
  if (!res.ok) throw new Error("No se pudo verificar el nombre del videojuego.");
  const exists = await res.json();
  return exists === true;
}

async function checkNameTeamUnique(apiBaseUrl: string, teamName: string) {
  const res = await fetch(`${apiBaseUrl}/teams/name/${encodeURIComponent(teamName)}`);
  if (!res.ok) throw new Error("No se pudo verificar el nombre del equipo.");
  const exists = await res.json();
  return exists === true;
}

/* ────────────────────────────────────────────────────────────────────
   Team Wizard Dialog
──────────────────────────────────────────────────────────────────── */
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

    if (m.codigo_estudiantil && String(m.codigo_estudiantil).trim() !== "") {
      memberObj.studentCode = String(m.codigo_estudiantil);
    } else {
      memberObj.studentCode = data.isExternal ? makeRandomStudentCode() : String(m.codigo_estudiantil ?? "");
    }

    return memberObj;
  });


  const existingRaw = data?.videojuego?.additionalImages ?? [];
  const existingUrls: string[] = (existingRaw || []).map((it: any) => (typeof it === "string" ? it : it?.url)).filter(Boolean);

  const removed: string[] = Array.isArray((data as any)?.videojuego?._remove_gallery) ? (data as any).videojuego._remove_gallery : [];
  const remainingExisting = existingUrls.filter(u => !removed.includes(u));

  const newUrls: string[] = (galleryUploads || []).map((g) => g.url).filter(Boolean);

  const finalUrls: string[] = Array.from(new Set([...remainingExisting, ...newUrls]));

  const videogamePayload: any = {
    vgName: data.videojuego?.nombre,
    description: data.videojuego?.descripcion,
    repoUrl: data.videojuego?.repo_url ?? null,
    logoUrl: logoUpload?.url ?? data.videojuego?.logo_url,
    additionalImages: finalUrls, // string[]
    videoUrl: data.videojuego?.video_demo_url ?? data.videojuego?.video_demo_url ?? null,
  };
  
  delete videogamePayload._remove_gallery;
  delete videogamePayload._remove_logo;

  return {
    teamName: data.nombre_equipo,
    isExternal: data.isExternal,
    members,
    videogame: videogamePayload,
  };
}

/** Para abrir "Editar" desde la tabla */
export function toInitialValuesFromTeam(team: TeamRowData, isExternalGuess = false): WizardValues {
  const integrantes = team.integrantes.map((m: any) => ({
    id_integrante: m.id_integrante ?? m.id ?? undefined, // ✅ conservar id del integrante
    nombre: m.nombre || "",
    apellido: m.apellido || "",
    correo: m.correo || "",
    codigo_estudiantil: String(m.codigo_estudiantil ?? ""),
    nrcIds: Array.isArray((m as any).nrcs) ? (m as any).nrcs.map((n: any) => n.id_nrc ?? n.id ?? n.code) : [],
  }));

  // si el equipo no trae team_nrc_global_id, intentar derivarlo del primer integrante
  let inferredTeamNrc: number | undefined = undefined;
  if ((team as any).team_nrc_global_id) {
    inferredTeamNrc = (team as any).team_nrc_global_id;
  } else if (integrantes.length > 0 && Array.isArray((team.integrantes?.[0] as any)?.nrcs) && (team.integrantes?.[0] as any).nrcs.length > 0) {
    const firstNrc = (team.integrantes?.[0] as any).nrcs[0];
    inferredTeamNrc = firstNrc?.id_nrc ?? firstNrc?.id ?? undefined;
  }

  return {
    id_equipo: team.id_equipo,
    mode: "edit",
    isExternal: (team as any).isExternal ?? isExternalGuess,
    team_nrc_global_id: inferredTeamNrc ?? (team as any).teamNrcGlobal ?? undefined,
    nombre_equipo: team.nombre_equipo,
    videojuego: {
      nombre: team.videojuego.nombre,
      descripcion: team.videojuego.descripcion,
      logo_url: team.videojuego.logo_url,
      video_demo_url: (team as any).videojuego?.video_demo_url || "",
      additionalImages: team.videojuego.additionalImages || [],
    },
    integrantes,
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

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(0);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [nrcActivos, setNrcActivos] = useState<NrcOption[]>([]);
  const [updateLikesFunction, setUpdateLikesFunction] = useState<(() => Promise<void>) | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);

  const API_ENDPOINT = `${import.meta.env.VITE_ENDPOINT_BACKEND}/nrcs/select-options`;

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
        setNrcActivos([]);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchNrcs();
  }, [API_ENDPOINT]);

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
    videojuego: { nombre: "", descripcion: "", logo_url: "", video_demo_url: "", additionalImages: [] },
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

  const { control, watch, reset, formState } = methods;
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

  const nextFromStep1 = async () => {
    const vals = methods.getValues();

    await methods.trigger(["nombre_equipo", "videojuego.nombre", "videojuego.descripcion"]);

    if (errors?.nombre_equipo || errors?.videojuego?.nombre || errors?.videojuego?.descripcion) {
      return;
    }

    if (isExternal && vals.team_nrc_global_id !== undefined && vals.team_nrc_global_id !== null && String(vals.team_nrc_global_id).trim() === "") {
      toast.error("Selecciona el NRC global para colegios");
      return;
    }

    try {
      setBusy(true);
      const exists = await checkGameNameUnique(apiBaseUrl, vals.videojuego.nombre);
      const teamExists = await checkNameTeamUnique(apiBaseUrl, vals.nombre_equipo);
      if (exists && (mode !== "edit" || vals.videojuego.nombre !== (initialData?.videojuego?.nombre || ""))) {
        toast.error("El nombre del videojuego ya está en uso.");
        return;
      }
      if (teamExists && (mode !== "edit" || vals.nombre_equipo !== (initialData?.nombre_equipo || ""))) {
        toast.error("El nombre del equipo ya está en uso.");
        return;
      }
      setStep(2);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo verificar el nombre del videojuego");
    } finally {
      setBusy(false);
    }
  };

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
    const urls = galleryFiles.map((f) => URL.createObjectURL(f));
    setGalleryPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryFiles]);

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

  const watchedIntegrantes = useWatch({ control, name: "integrantes" });

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


  useEffect(() => {
    if (!open || !initialData) return;
    const currentMode = methods.getValues("mode") ?? initialData.mode;
    if (currentMode !== "edit") return;

    if ((!safeNrcs || safeNrcs.length === 0) && (!nrcActivos || nrcActivos.length === 0)) return;

    const normalizeCandidate = (candidate: any) => {
      if (candidate == null) return "";
      if (typeof candidate === "object") {
        return String(candidate.id_nrc ?? candidate.id ?? candidate.code ?? candidate.codigo ?? candidate.codeStr ?? "");
      }
      return String(candidate);
    };

    const findSafeId = (candidate: any): number | undefined => {
      const str = normalizeCandidate(candidate).trim();
      if (!str) return undefined;

      const matchFromActivos = (nrcActivos || []).find((n: any) => {
        const vals = [
          n?.id_nrc,
          n?.id,
          n?.code,
          n?.codigo,
          n?.codeStr,
          n?.codigo_nrc,
        ].map((v: any) => (v === undefined || v === null ? "" : String(v).trim()));
        return vals.includes(str) || vals.includes(String(Number(str)));
      });
      if (matchFromActivos) {
        const codeVal = matchFromActivos.code ?? matchFromActivos.codigo ?? matchFromActivos.id_nrc ?? matchFromActivos.id;
        const num = Number(codeVal);
        if (Number.isFinite(num)) return num;
        const fallbackId = matchFromActivos.id ?? matchFromActivos.id_nrc;
        if (fallbackId != null) {
          const found = safeNrcs.find(s => String(s.id) === String(fallbackId) || s.codeStr === String(fallbackId));
          if (found) return found.id;
        }
      }

      const foundSafe =
        safeNrcs.find((s) => s.codeStr === str || String(s.id) === str) ||
        safeNrcs.find((s) => Number(s.id) === Number(str));
      if (foundSafe) return foundSafe.id;

      return undefined;
    };

    (initialData.integrantes || []).forEach((member: any, idx: number) => {
      const raw = Array.isArray(member.nrcs) && member.nrcs.length > 0
        ? member.nrcs
        : Array.isArray(member.nrcIds)
          ? member.nrcIds
          : [];
      const ids = (raw || [])
        .map(findSafeId)
        .filter((v: any): v is number => v !== undefined);
      methods.setValue(`integrantes.${idx}.nrcIds`, ids.length ? ids : []);
    });

    const initialTeam = initialData.team_nrc_global_id ?? initialData.team_nrc_global_id ?? methods.getValues("team_nrc_global_id");
    if (initialTeam) {
      const resolved = findSafeId(initialTeam) ?? (Number(initialTeam) || undefined);
      if (resolved !== undefined) methods.setValue("team_nrc_global_id", resolved);
    } else if (initialData.integrantes && initialData.integrantes.length > 0) {
      const first = initialData.integrantes[0];
      const firstRaw = Array.isArray(first.nrcIds) && first.nrcIds.length > 0 ? first.nrcIds[0] : (Array.isArray(first.nrcIds) && first.nrcIds.length > 0 ? first.nrcIds[0] : undefined);
      const resolvedFirst = findSafeId(firstRaw);
      if (resolvedFirst !== undefined) methods.setValue("team_nrc_global_id", resolvedFirst);
    }
  }, [open, safeNrcs, nrcActivos, initialData, methods]);

  const onSubmit = methods.handleSubmit((data: any) => {
    return submitTeam(data, {
      methods,
      setBusy,
      apiBaseUrl,
      initialData,
      logoFile,
      galleryFiles,
      nrcOptions,
      primaryEmailLocked,
      uploadFilesToAzure,
      findUsedEmails,
      buildPayload,
      toast,
      onOpenChange,
      onSuccess,
      updateLikes: updateLikesFunction || undefined,
    } as SubmitCtx);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[92vw] sm:max-w-2xl">
        <FormProvider {...methods}>
          <TeamWizardForm
            handleFormSubmit={handleFormSubmit}
            methods={methods}
            step={step}
            setStep={setStep}
            busy={busy}
            nextFromStep1={nextFromStep1}
            nextFromStep2={nextFromStep2}
            fields={fields}
            append={append}
            remove={remove}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            logoInputRef={logoInputRef}
            galleryInputRef={galleryInputRef}
            handleLogoInputChange={handleLogoInputChange}
            logoPreview={logoPreview}
            setLogoFile={setLogoFile}
            selectedLogoFile={selectedLogoFile}
            cropperOpen={cropperOpen}
            setCropperOpen={setCropperOpen}
            handleCroppedLogo={handleCroppedLogo}
            galleryPreviews={galleryPreviews}
            handleGalleryChange={handleGalleryChange}
            handleDeleteGallery={handleDeleteGallery}
            watchedIntegrantes={watchedIntegrantes}
            safeNrcs={safeNrcs}
            isPageLoading={isPageLoading}
            isExternal={isExternal}
            toast={toast}
            setUpdateLikesFunction={setUpdateLikesFunction}
          />
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}