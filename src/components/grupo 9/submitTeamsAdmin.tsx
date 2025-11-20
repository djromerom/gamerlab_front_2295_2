import { WizardSchema } from "./validationTeamsAdmin";

export type SubmitCtx = {
  methods: any;
  setBusy: (v: boolean) => void;
  apiBaseUrl: string;
  initialData?: any;
  logoFile: File | null;
  galleryFiles: File[];
  nrcOptions: any[];
  primaryEmailLocked?: string | undefined;
  uploadFilesToAzure: (files: File[]) => Promise<any[]>;
  findUsedEmails: (apiBaseUrl: string, emails: string[], excludeEmails?: string[]) => Promise<string[]>;
  buildPayload: (data: any, logoUpload: any | null, galleryUploads: any[], nrcOptions: any[], primaryEmailLocked?: string | undefined) => any;
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
    galleryFiles,
    nrcOptions,
    primaryEmailLocked,
    uploadFilesToAzure,
    findUsedEmails,
    buildPayload,
    toast,
    onOpenChange,
    onSuccess,
  } = ctx;

  setBusy(true);
  try {
    const formValues = methods.getValues();
    WizardSchema.parse(formValues);
    const formIsExternal = !!formValues.isExternal;
    (data as any).isExternal = formIsExternal;
    (data as any).integrantes = formValues.integrantes ?? (data as any).integrantes;

    (formValues.integrantes || []).forEach((_: any, i: any) =>
      methods.clearErrors(`integrantes.${i}.correo`)
    );

    const isValidEmail = (e?: string) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
    const emailMessages: string[] = [];
    (data.integrantes || []).forEach((m: any, idx: number) => {
      const correo = (m?.correo || "").trim();
      if (!isValidEmail(correo) && data.isExternal === true) {
        const msg = "Ingresa un correo válido";
        methods.setError(`integrantes.${idx}.correo`, { type: "client", message: msg });
        emailMessages.push(`Miembro ${idx + 1}: ${msg}`);
        return;
      }
      if (data.isExternal === false) {
        if (!correo.toLowerCase().endsWith("@uninorte.edu.co")) {
          const msg = "El correo debe ser institucional (@uninorte.edu.co)";
          methods.setError(`integrantes.${idx}.correo`, { type: "client", message: msg });
          emailMessages.push(`Miembro ${idx + 1}: ${msg}`);
        }
      }
    });
    if (emailMessages.length) {
      toast.error(emailMessages.join("; "));
      return;
    }

    if (!data.isExternal && data.integrantes.length > 0) {
      const emails = data.integrantes.map((m: { correo: any }) => (m.correo || "").trim());
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

        excludeEmails = Array.from(new Set(excludeEmails));
      } else {
        excludeEmails = [];
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

    const fullPayload = buildPayload(data, logoUpload, galleryUploads, nrcOptions, primaryEmailLocked);

    const url = data.mode === "add" ? `${apiBaseUrl}/teams/admin` : `${apiBaseUrl}/teams/${data.id_equipo}`;
    const method = data.mode === "add" ? "POST" : "PATCH";

    let requestBody: any = fullPayload;

    if (method === "PATCH") {
      const patch: any = {};
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
        additionalImages: [],
        ...(initialData?.videojuego || {}),
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

      const membersPatch: any[] = [];
      const origMembers = initialData?.integrantes || [];
      const curMembers = data.integrantes || [];

      const globalNrcCodeForPatch =
        data.isExternal && data.team_nrc_global_id
          ? (() => {
              const v = data.team_nrc_global_id;
              const match = (nrcOptions || []).find((n: any) => {
                return (
                  n?.id_nrc === v ||
                  n?.id === v ||
                  String(n?.id_nrc) === String(v) ||
                  String(n?.id) === String(v) ||
                  String(n?.code ?? n?.codigo ?? n?.codeStr ?? "") === String(v)
                );
              });
              return match ? (match.codigo ?? match.id_nrc ?? String(v)) : String(v);
            })()
          : undefined;

      const makeRandomStudentCodeForPatch = (() => {
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

      const origIdsSet = new Set<number | string>(origMembers.map((m: any) => m?.id_integrante ?? m?.id).filter(Boolean));
      const curIdsSet = new Set<number | string>();

      for (let idx = 0; idx < curMembers.length; idx++) {
        const cur = curMembers[idx];
        const orig = origMembers[idx] || null;
        const id = cur?.id_integrante ?? orig?.id_integrante;
        if (id != null) curIdsSet.add(id);
        if (id == null && (!orig || orig == null)) {
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

          if (cur.codigo_estudiantil && String(cur.codigo_estudiantil).trim() !== "") {
            newMember.studentCode = String(cur.codigo_estudiantil);
          } else {
            newMember.studentCode = makeRandomStudentCodeForPatch();
          }
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
          const origNrcs = Array.isArray(orig?.nrcIds) ? orig.nrcIds.map(String) : (Array.isArray((orig as any).nrcs) ? (orig as any).nrcs.map((n: any) => String(n.id_nrc ?? n.id ?? n.code)) : []);
          const curNrcs = (cur?.nrcIds || []).map(String);

          if (data.isExternal) {
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

    console.log("Submitting teams payload (stringified):", JSON.stringify(requestBody));

    const fetchOpts = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    };

    let res: Response | null = null;
    try {
      res = await fetch(url, fetchOpts as any);

      // debug logs (headers/body)
      console.groupCollapsed("Teams API response debug");
      console.log("url:", url);
      console.log("request method:", method);
      console.log("request headers:", fetchOpts.headers);
      console.log("response status:", res.status, res.statusText);
      try {
        res.headers.forEach((value, key) => console.log(key + ":", value));
      } catch (e) {
        console.log("Unable to iterate response.headers:", e);
      }
      const rawText = await res.text().catch(() => "<no body>");
      console.log("response raw body:", rawText);
      let parsed: any = null;
      try {
        parsed = rawText && rawText !== "<no body>" ? JSON.parse(rawText) : rawText;
      } catch (e) {
        parsed = rawText;
      }
      console.log("response parsed body:", parsed);
      console.groupEnd();

      if (!(data.mode === "add" ? res.status === 201 : res.ok)) {
        const errBody = parsed ?? {};
        let mapped = false;
        const mappedMsgs: string[] = [];

        const sourceObj = errBody.errors ?? (typeof errBody.message === "object" ? errBody.message : undefined);
        if (sourceObj && typeof sourceObj === "object") {
          Object.entries(sourceObj).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v.join(", ") : String(v);
            const normalized = String(k).replace(/^members\./, "integrantes.").replace(/\[(\d+)\]/g, '.$1');
            try {
              methods.setError(normalized, { type: "server", message: msg });
              mapped = true;
              mappedMsgs.push(msg);
            } catch (e) {
              console.warn("Failed to setError for", normalized, msg, e);
            }
          });
        }

        if (!mapped) {
          const messagesArr: string[] = [];
          if (Array.isArray(errBody.message)) messagesArr.push(...errBody.message.map(String));
          else if (typeof errBody.message === "string") messagesArr.push(errBody.message);
          else if (typeof errBody === "string") messagesArr.push(errBody);

          messagesArr.forEach((rawMsg) => {
            const m = String(rawMsg).match(/members\.(\d+)\.(.+)$/i);
            if (m) {
              const idx = Number(m[1]);
              const msg = m[2].trim();
              const path = `integrantes.${idx}.correo`;
              try {
                methods.setError(path, { type: "server", message: msg });
                mapped = true;
                mappedMsgs.push(msg);
              } catch (e) {
                console.warn("Failed to setError for", path, msg, e);
              }
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

      // success
    } catch (err: any) {
      console.error("Teams submit fatal error:", err, { url, method, requestBody, response: res ? { status: res.status, statusText: res.statusText } : null });
      const msg = err?.message ? (String(err.message).slice(0, 400)) : "Error inesperado";
      toast.error("Error al guardar: " + msg);
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