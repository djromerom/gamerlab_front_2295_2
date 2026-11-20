import { apiFetch } from "@/lib/api";
import { WizardSchema } from "./validationTeamsAdmin";

export type SubmitCtx = {
  methods: any;
  setBusy: (v: boolean) => void;
  apiBaseUrl: string;
  initialData?: any;
  logoFile: File | null;
  zipFile: File | null;
  galleryFiles: File[];
  nrcOptions: any[];
  primaryEmailLocked?: string | undefined;
  uploadFilesToAzure: (files: File[]) => Promise<any[]>;
  uploadZipToAzure: (file: File) => Promise<any>;
  findUsedEmails: (apiBaseUrl: string, emails: string[], excludeEmails?: string[]) => Promise<string[]>;
  buildPayload: (data: any, logoUpload: any | null, galleryUploads: any[], nrcOptions: any[], primaryEmailLocked?: string | undefined, zipUpload?: any | null) => any;
  toast: any;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
};

export async function submitTeam(data: any, ctx: SubmitCtx) {
  const {
    methods,
    setBusy,
    apiBaseUrl,
    initialData,
    logoFile,
    zipFile,
    galleryFiles,
    nrcOptions,
    primaryEmailLocked,
    uploadFilesToAzure,
    uploadZipToAzure,
    findUsedEmails,
    buildPayload,
    toast,
    onOpenChange,
    onSuccess,
  } = ctx;

  // Helper: generar código para miembros colegio (externos) nuevos sin código
  const randomStudentCode = (() => {
    const used = new Set<string>();
    return () => {
      let n: number;
      do {
        n = 400000000 + Math.floor(Math.random() * 500000000);
      } while (used.has(String(n)));
      used.add(String(n));
      return String(n);
    };
  })();

  // Normalizar array NRC (retorna array de strings de códigos)
  function buildNrcCodeArray(member: any, isExternalTeam: boolean, globalNrcId: any): string[] {
    if (isExternalTeam) {
      if (!globalNrcId) return [];
      const match = nrcOptions.find((n: any) =>
        [n.id, n.id_nrc, n.codigo, n.codeStr, n.code]
          .map(x => String(x))
          .includes(String(globalNrcId))
      );
      return [String(match?.codigo ?? match?.codeStr ?? match?.id_nrc ?? globalNrcId)];
    }
    const ids: number[] = Array.isArray(member?.nrcIds) ? member.nrcIds : [];
    return ids
      .map(id => {
        const found = nrcOptions.find((n: any) => Number(n.id_nrc ?? n.id) === Number(id));
        return String(found?.codigo ?? found?.codeStr ?? id);
      })
      .filter(Boolean);
  }

  setBusy(true);
  try {
    const formValues = methods.getValues();
    WizardSchema.parse(formValues);
    data.isExternal = !!formValues.isExternal;
    data.integrantes = formValues.integrantes ?? data.integrantes;

    (formValues.integrantes || []).forEach((_: any, i: any) =>
      methods.clearErrors(`integrantes.${i}.correo`)
    );

    const isValidEmail = (e?: string) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
    const emailMessages: string[] = [];
    (data.integrantes || []).forEach((m: any, idx: number) => {
      const correo = (m?.correo || "").trim();
      if (!isValidEmail(correo)) {
        const msg = "Ingresa un correo válido";
        methods.setError(`integrantes.${idx}.correo`, { type: "client", message: msg });
        emailMessages.push(`Miembro ${idx + 1}: ${msg}`);
        return;
      }
    });
    if (emailMessages.length) {
      toast.error(emailMessages.join("; "));
      return;
    }

    if (!data.isExternal && data.integrantes.length > 0) {
      const emails = data.integrantes.map((m: any) => (m.correo || "").trim());
      let excludeEmails: string[] = [];

      if (data.mode === "edit" && initialData?.integrantes) {
        const origById = new Map<number | string, string>();
        (initialData.integrantes || []).forEach((m: any) => {
          const id = m?.id_integrante ?? m?.id;
          if (id != null) origById.set(id, (m.correo || "").trim());
        });

        data.integrantes.forEach((m: any, idx: number) => {
          const id = m?.id_integrante ?? m?.id;
          const curEmail = (m?.correo || "").trim();
          if (id != null && origById.get(id) === curEmail) {
            excludeEmails.push(curEmail);
          } else {
            const origAtPos = (initialData.integrantes?.[idx]?.correo || "").trim();
            if (origAtPos && origAtPos === curEmail) excludeEmails.push(curEmail);
          }
        });

        // Excluir correos de miembros recién agregados (tienen id nuevo no presente en initialData)
        const originalIds = new Set(
          (initialData.integrantes || []).map((m: any) => m?.id_integrante ?? m?.id).filter((v: any) => v != null)
        );
        data.integrantes.forEach((m: any) => {
          const id = m?.id_integrante ?? m?.id;
          if (id != null && !originalIds.has(id)) {
            const curEmail = (m?.correo || "").trim();
            if (curEmail) excludeEmails.push(curEmail);
          }
        });

        excludeEmails = Array.from(new Set(excludeEmails));
      }

      const dup = await findUsedEmails(apiBaseUrl, emails, excludeEmails);
      if (dup.length) {
        toast.error(`Correo(s) ya usados: ${dup.join(", ")}`);
        return;
      }
    }

    let logoUpload: any = null;
    if (logoFile) {
      const [logoMeta] = await uploadFilesToAzure([logoFile]);
      logoUpload = logoMeta || null;
    }

    let galleryUploads: any[] = [];
    if (galleryFiles.length) {
      if (galleryFiles.length > 5) throw new Error("Máximo 5 imágenes");
      galleryUploads = await uploadFilesToAzure(galleryFiles);
    }

    let zipUpload: any = null;
    if (zipFile) {
      zipUpload = await uploadZipToAzure(zipFile);
    }

    const fullPayload = buildPayload(
      data,
      logoUpload,
      galleryUploads,
      nrcOptions,
      primaryEmailLocked,
      zipUpload
    );

    const url =
      data.mode === "add"
        ? `${apiBaseUrl}/teams/admin`
        : `${apiBaseUrl}/teams/${data.id_equipo}`;
    const method = data.mode === "add" ? "POST" : "PATCH";

    let requestBody: any = fullPayload;

    if (method === "PATCH") {
      const patch: any = {};
      const changed = (a: any, b: any) => {
        try { return JSON.stringify(a) !== JSON.stringify(b); } catch { return a !== b; }
      };

      // Equipo
      const origTeamName = initialData?.nombre_equipo ?? "";
      if (changed(fullPayload.teamName, origTeamName)) patch.teamName = fullPayload.teamName;

      const origIsExternal = initialData?.isExternal ?? false;
      if (changed(fullPayload.isExternal, origIsExternal)) patch.isExternal = fullPayload.isExternal;

      const origGlobalNrc = initialData?.team_nrc_global_id ?? undefined;
      if (changed(fullPayload.team_nrc_global_id, origGlobalNrc))
        patch.team_nrc_global_id = fullPayload.team_nrc_global_id;

      // Videojuego
      const vgPatch: any = {};
      const origVg = {
        nombre: "",
        descripcion: "",
        repo_url: "",
        logo_url: "",
        video_demo_url: "",
        additionalImages: [],
        gameFileUrl: null,
        entry: null,
        ...(initialData?.videojuego || {}),
      };
      const curVg = fullPayload.videogame || {};
      if (changed(curVg.vgName, origVg.nombre)) vgPatch.vgName = curVg.vgName;
      if (changed(curVg.description, origVg.descripcion)) vgPatch.description = curVg.description;
      if (changed(curVg.repoUrl, origVg.repo_url)) vgPatch.repoUrl = curVg.repoUrl;
      if (changed(curVg.logoUrl, origVg.logo_url)) vgPatch.logoUrl = curVg.logoUrl;
      if (changed(curVg.videoUrl, origVg.video_demo_url)) vgPatch.videoUrl = curVg.videoUrl;
      if (changed(curVg.additionalImages, origVg.additionalImages)) vgPatch.additionalImages = curVg.additionalImages;
      if (changed(curVg.gameFileUrl, origVg.gameFileUrl ?? null)) vgPatch.gameFileUrl = curVg.gameFileUrl;
      if (changed(curVg.entry, origVg.entry ?? null)) vgPatch.entry = curVg.entry;
      if (Object.keys(vgPatch).length) patch.videogame = vgPatch;

      // Miembros (solo actualizar / remover; los nuevos ya fueron creados vía add-member)
      const membersPatch: any[] = [];
      const origMembers = initialData?.integrantes || [];
      const curMembers = data.integrantes || [];
      const isExternalTeam = !!data.isExternal;
      const globalNrcId = data.team_nrc_global_id;

      const origIdsSet = new Set(
        origMembers.map((m: any) => m?.id_integrante ?? m?.id).filter(Boolean)
      );
      const curIdsSet = new Set<any>();

      for (let idx = 0; idx < curMembers.length; idx++) {
        const cur = curMembers[idx];
        const curId = cur?.id_integrante ?? cur?.id ?? null;
        if (curId != null) curIdsSet.add(curId);

        const orig = origMembers.find(
          (om: any) => (om?.id_integrante ?? om?.id) === curId
        ) || null;

        // Miembro nuevo: NO se incluye en patch (ya creado antes)
        if (!orig) continue;

        const curEmail = (cur?.correo || "").trim();
        const curFirst = cur?.nombre || "";
        const curLast = cur?.apellido || "";
        const curStudentCode = cur?.codigo_estudiantil
          ? String(cur.codigo_estudiantil)
          : (isExternalTeam ? String(cur.codigo_estudiantil || "") : undefined);

        const curNrcArray = buildNrcCodeArray(cur, isExternalTeam, globalNrcId);
        const origEmail = (orig?.correo || "").trim();
        const origFirst = orig?.nombre || "";
        const origLast = orig?.apellido || "";
        const origStudentCode = orig?.codigo_estudiantil
          ? String(orig.codigo_estudiantil)
          : (isExternalTeam ? String(orig.codigo_estudiantil || "") : undefined);
        const origNrcArray = buildNrcCodeArray(orig, !!initialData?.isExternal, initialData?.team_nrc_global_id);

        const memberPatch: any = { id: curId };

        if (changed(curEmail, origEmail)) memberPatch.memberEmail = curEmail;
        if (changed(curFirst, origFirst)) memberPatch.memberFirstName = curFirst;
        if (changed(curLast, origLast)) memberPatch.memberLastName = curLast;
        if (changed(curStudentCode, origStudentCode)) memberPatch.studentCode = curStudentCode;
        if (changed(curNrcArray, origNrcArray)) memberPatch.nrc = curNrcArray.map(String); // garantiza array de strings

        // Si solo tiene id no se envía
        if (Object.keys(memberPatch).length > 1) membersPatch.push(memberPatch);
      }

      // IDs removidos
      const removedIds = Array.from(origIdsSet).filter(id => !curIdsSet.has(id));
      if (membersPatch.length) patch.members = membersPatch;
      if (removedIds.length) patch.removedMemberIds = removedIds;

      // Si nada cambió
      if (!Object.keys(patch).length) {
        toast.info("No hay cambios para guardar");
        setBusy(false);
        return;
      }

      requestBody = patch;
    }

    const fetchOpts = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    };

    let res: Response | null = null;
    try {
      res = await apiFetch(url, fetchOpts as any);
      const rawText = await res.text().catch(() => "<no body>");
      let parsed: any = null;
      try {
        parsed = rawText && rawText !== "<no body>" ? JSON.parse(rawText) : rawText;
      } catch {
        parsed = rawText;
      }

      if (!(data.mode === "add" ? res.status === 201 : res.ok)) {
        const errBody = parsed ?? {};
        let mapped = false;
        const mappedMsgs: string[] = [];

        const sourceObj =
          errBody.errors ??
          (typeof errBody.message === "object" ? errBody.message : undefined);
        if (sourceObj && typeof sourceObj === "object") {
          Object.entries(sourceObj).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v.join(", ") : String(v);
            const normalized = String(k)
              .replace(/^members\./, "integrantes.")
              .replace(/\[(\d+)\]/g, ".$1");
            try {
              methods.setError(normalized, { type: "server", message: msg });
              mapped = true;
              mappedMsgs.push(msg);
            } catch { }
          });
        }

        if (!mapped) {
          const messagesArr: string[] = [];
          if (Array.isArray(errBody.message)) messagesArr.push(...errBody.message.map(String));
          else if (typeof errBody.message === "string") messagesArr.push(errBody.message);
          else if (typeof errBody === "string") messagesArr.push(errBody);

          messagesArr.forEach(rawMsg => {
            const m = String(rawMsg).match(/members\.(\d+)\.(.+)$/i);
            if (m) {
              const idx = Number(m[1]);
              const msg = m[2].trim();
              const path = `integrantes.${idx}.correo`;
              try {
                methods.setError(path, { type: "server", message: msg });
                mapped = true;
                mappedMsgs.push(msg);
              } catch { }
            } else {
              mappedMsgs.push(String(rawMsg));
            }
          });
        }

        if (mapped) {
          toast.error(mappedMsgs.join("; "));
          return;
        }

        const fallback = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        throw new Error(fallback || `Error ${res.status}`);
      }
    } catch (err: any) {
      toast.error("Error al guardar: " + (err?.message || "Error inesperado"));
      setBusy(false);
      return;
    }

    toast.success(data.mode === "add" ? "Equipo registrado correctamente" : "Equipo actualizado correctamente");

    onOpenChange(false);
    onSuccess();
  } catch (e: any) {
    toast.error("Error al guardar", { description: e?.message || "Error inesperado" });
  } finally {
    setBusy(false);
  }
}