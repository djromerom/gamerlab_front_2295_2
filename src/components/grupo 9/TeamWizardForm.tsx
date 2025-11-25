import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageCropper } from "@/components/grupo 11/ImageCropper";
import { CloudUpload, X, ChevronLeft, ChevronRight, Loader2, Trash2, Plus, Pencil } from "lucide-react";
import { useState } from "react";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive mt-1">{message}</p>;
}

const apiBaseUrl = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export default function TeamWizardForm(props: any) {
  const {
    handleFormSubmit,
    methods,
    step,
    setStep,
    busy,
    nextFromStep1,
    nextFromStep2,
    fields,
    append,
    remove,
    editingIndex,
    setEditingIndex,
    logoInputRef,
    galleryInputRef,
    handleLogoInputChange,
    logoPreview,
    setLogoFile,
    selectedLogoFile,
    cropperOpen,
    setCropperOpen,
    handleCroppedLogo,
    galleryPreviews,
    handleGalleryChange,
    handleDeleteGallery,
    watchedIntegrantes,
    safeNrcs,
    isPageLoading,
    isExternal,
    toast,
  } = props;

  const [internalIsLoading, setInternalIsLoading] = useState(false);

  async function resendInvite(email: string) {
    if (internalIsLoading) return; // prevent multiple petitions
    setInternalIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message || "No se pudo enviar el correo de confirmación");
        throw new Error(err?.message || "No se pudo enviar el correo");
      }
      toast.success("Correo de confirmación enviado");
    } catch (e: any) {
      toast.error(e?.message || "Error al enviar");
    } finally {
      setInternalIsLoading(false);
    }
  }

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

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();

        const existingRaw = methods.getValues("videojuego.additionalImages") || [];
        const existingUrls: string[] = (existingRaw || []).map((it: any) => (typeof it === "string" ? it : it?.url)).filter(Boolean);
        const removed: string[] = methods.getValues("videojuego._remove_gallery") || [];
        const remainingExisting = existingUrls.filter(u => !removed.includes(u));

        const newUrls: string[] = (props.galleryUploads || []).map((u: any) => u?.url).filter(Boolean);

        const finalUrls = Array.from(new Set([...remainingExisting, ...newUrls]));

        methods.setValue("videojuego.additionalImages", finalUrls, { shouldDirty: true });
        methods.setValue("videojuego._remove_gallery", [], { shouldDirty: false });

        try {
          // Enviar el formulario (backend)
          const result = await handleFormSubmit(e);

          // Si estamos en modo "add", enviar confirmación al primer miembro
          if (result?.ok) {
            if (methods.getValues("mode") === "add") {
              const email = methods.getValues("integrantes.0.correo");
              if (email) await resendInvite(email);
              toast.success(`Se pudo enviar correo de confirmación a ${methods.getValues("integrantes.0.correo")}`);
            }
          }
        } catch (err) {
          console.error("Error submitting form:", err);
        }
      }}
      className="space-y-4 pt-8 sm:pt-0 max-h-[90vh] sm:max-h-[auto] overflow-auto p-4 sm:p-0"
    >
      {/* indicador 3 pasos */}
      <div className="relative z-10 flex items-center gap-2 text-xs pr-4 sm:pr-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 rounded w-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <StepHeader
        step={step}
        total={3}
        title={step === 1
          ? "Ingresa los datos del equipo y su videojuego"
          : step === 2
            ? "Agrega los miembros del equipo y sus datos"
            : "Información adicional del proyecto"}

      />

      {/* Título principal: registrar o editar según el modo */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold">
          {methods.watch("mode") === "add" ? "Registrar equipo" : "Editar equipo"}
        </h2>
      </div>

      {/* PASO 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1 justify-between align-baseline sm:flex-row sm:items-end">

              <div className="flex-1 space-y-3 mt-3 sm:mt-0">
                <div className="flex flex-col gap-1">
                  <Label>Tipo de equipo</Label>
                  <Select
                    value={methods.watch("isExternal") ? "colegio" : "uninorte"}
                    onValueChange={(v) => methods.setValue("isExternal", v === "colegio")}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona el tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uninorte">Uninorte</SelectItem>
                      <SelectItem value="colegio">Colegio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 space-y-3 mt-3 sm:mt-0">
                {/* NRC global si es colegio */}
                {methods.watch("isExternal") && (
                  <div className="flex flex-col gap-1">
                    <Label>NRC (global equipo)</Label>
                    <Select
                      value={(() => {
                        const v = methods.watch("team_nrc_global_id");
                        return typeof v === "number" ? String(v) : "";
                      })()}
                      onValueChange={(value) => methods.setValue("team_nrc_global_id", value ? parseInt(value, 10) : undefined)}
                      disabled={isPageLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isPageLoading ? "Cargando NRCs..." : safeNrcs.length ? "Selecciona un NRC" : "No hay NRCs disponibles"} />
                      </SelectTrigger>
                      <SelectContent>
                        {safeNrcs.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {isPageLoading ? "Cargando..." : "No hay NRCs disponibles."}
                          </div>
                        ) : (
                          safeNrcs.map((n: any) => (
                            <SelectItem key={n.id} value={String(n.id)}>
                              {n.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FieldError message={(methods.formState.errors as any)?.team_nrc_global_id?.message} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Nombre del equipo</Label>
                <Input className="w-full" maxLength={50}{...methods.register("nombre_equipo")} placeholder="Ej: Pixel Ninjas" />
                <div className="flex justify-between items-center">
                  <FieldError message={(methods.formState.errors as any)?.nombre_equipo?.message} />
                  <div className="text-xs text-muted-foreground float-right">{methods.watch("nombre_equipo")?.length || 0}/50</div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label>Nombre del videojuego</Label>
                <Input className="w-full" {...methods.register("videojuego.nombre")} placeholder="Ej: Cyber Runner" />
                <FieldError message={(methods.formState.errors as any)?.videojuego?.nombre?.message} />
              </div>


            </div>

            <div className="flex flex-col gap-1">
              <Label>Descripción</Label>
              <textarea className="p-2 border rounded-md w-full resize-none" rows={4} maxLength={300} {...methods.register("videojuego.descripcion")} placeholder="Breve descripción del juego…" />
              <div className="flex justify-between items-center">
                <FieldError message={(methods.formState.errors as any)?.videojuego?.descripcion?.message} />
                <div className="text-xs text-muted-foreground">{methods.watch("videojuego.descripcion")?.length || 0}/300</div>
              </div>

            </div>

            <div className="flex flex-col gap-1">
              <Label>Video demo (YouTube) – opcional</Label>
              <Input placeholder="https://youtu.be/..." {...methods.register("videojuego.video_demo_url")} />
              <FieldError message={(methods.formState.errors as any)?.videojuego?.video_demo_url?.message} />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Logo (opcional)</Label>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors hover:bg-muted/50 cursor-pointer w-full md:w-1/3"
                  onClick={() => logoInputRef.current?.click()} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") logoInputRef.current?.click(); }}>
                  <CloudUpload className="h-8 w-8 mb-2 text-gray-400" />
                  <p className="text-center text-sm text-gray-600">Haz clic para seleccionar una imagen</p>
                  <p className="text-xs text-gray-400 mt-1">Máximo 5 MB • PNG, JPG, JPEG</p>
                  <Input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoInputChange} className="hidden" />
                </div>

                <div className="flex-1 min-w-0">
                  {(() => {
                    const existingLogoUrl = methods.watch("videojuego.logo_url");
                    const src = logoPreview || existingLogoUrl;
                    return src ? (
                      <div className="relative inline-block w-full sm:w-32 md:w-32">
                        <img src={src} alt="Logo preview" className="rounded-md border object-cover w-full h-full" />
                        {logoPreview ? (
                          <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-40" onClick={() => setLogoFile(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 z-40"
                            onClick={() => {
                              setLogoFile?.(null);
                              methods.setValue("videojuego.logo_url", "");
                              methods.setValue("videojuego._remove_logo", true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No hay logo seleccionado.</p>
                    );
                  })()}
                  <div className="text-xs text-muted-foreground mt-2">Se abrirá un recortador para ajustar a 1:1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <Label>URL del Repositorio (opcional)</Label>
              <Input placeholder="https://github.com/usuario/proyecto" {...methods.register("videojuego.repo_url")} />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Fotos del Proyecto (opcional)</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-md border border-dashed p-4 cursor-pointer" onClick={() => galleryInputRef.current?.click()}>
                    <CloudUpload className="h-6 w-6 text-gray-400" />
                    <p className="ml-2 text-sm text-muted-foreground">Sube hasta 5 imágenes</p>
                    <Input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                  </div>
                </div>

                {(() => {
                  // 1) existentes del form (no las mutamos)
                  const existingRaw = methods.getValues("videojuego.additionalImages") ?? methods.watch("videojuego.additionalImages") ?? [];
                  const existingUrls: string[] = (existingRaw || [])
                    .map((it: any) => (typeof it === "string" ? it : it?.url))
                    .filter(Boolean);
                  // 2) marcadas para eliminar
                  const removedUrls: string[] = methods.watch("videojuego._remove_gallery") ?? [];
                  // 3) mostrar solo las no eliminadas
                  const visibleExisting = existingUrls.filter((u) => !removedUrls.includes(u));
                  const hasExisting = visibleExisting.length > 0;
                  const hasNew = (galleryPreviews?.length || 0) > 0;

                  if (!hasExisting && !hasNew) {
                    return <p className="text-xs text-muted-foreground">No hay fotos seleccionadas.</p>;
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {hasExisting && visibleExisting.map((src: string, idx: number) => (
                        <div key={`existing-${src}-${idx}`} className="relative group">
                          <div className="aspect-[6/3] overflow-hidden rounded-lg border">
                            <img src={src} alt={`Existing ${idx + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100 transition-opacity z-40"
                            onClick={() => {
                              // no mutar additionalImages; solo marcar para eliminar
                              const toRemove = visibleExisting[idx];
                              const removed = methods.getValues("videojuego._remove_gallery") || [];
                              if (!removed.includes(toRemove)) {
                                methods.setValue("videojuego._remove_gallery", [...removed, toRemove], { shouldDirty: true });
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {hasNew && (
                        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${hasExisting ? "pt-3" : ""}`}>
                          {galleryPreviews.map((src: string, idx: number) => (
                            <div key={`new-${src}-${idx}`} className="relative group">
                              <div className="aspect-[6/3] overflow-hidden rounded-lg border">
                                <img src={src} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                              </div>
                              <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100 transition-opacity z-40" onClick={() => handleDeleteGallery(idx)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: Miembros */}
      {step === 2 && (
        <div className="space-y-4">
          <div className={`space-y-3 ${fields.length > 4 ? "max-h-[50vh] sm:max-h-[420px] overflow-y-auto pr-2" : ""}`}>
            {fields.map((f: any, idx: number) => {
              const isOpen = editingIndex === idx;
              const member = (watchedIntegrantes?.[idx]) ?? methods.getValues(`integrantes.${idx}`);
              const memErrors = (methods.formState.errors as any)?.integrantes?.[idx] || {};
              return (
                <div key={f.id} className="rounded-md border bg-background">
                  <div className="flex items-center justify-between p-3">
                    <div className="text-sm">
                      <div className="font-medium flex items-center gap-2">
                        <span className="mr-2 text-muted-foreground">Miembro Nº {idx + 1}</span>
                        {member?.nombre || "—"} {member?.apellido || ""}
                      </div>
                      <div className="text-xs text-muted-foreground">{member?.correo || "correo no definido"}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={isOpen ? "secondary" : "outline"} onClick={() => setEditingIndex(isOpen ? null : idx)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        {isOpen ? "Cerrar" : "Editar"}
                      </Button>
                      <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => { remove(idx); setEditingIndex((prev: any) => { if (prev === null) return null; if (prev === idx) return null; return prev > idx ? prev - 1 : prev; }); }}>
                        <Trash2 className="w-4 h-4 mr-1" /> Quitar
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-3 pt-0 space-y-2">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex flex-col gap-1 sm:w-1/2">
                          <Label>Nombre</Label>
                          <Input {...methods.register(`integrantes.${idx}.nombre` as const)} />
                          <FieldError message={memErrors?.nombre?.message} />
                        </div>
                        <div className="flex flex-col gap-1 sm:w-1/2">
                          <Label>Apellido</Label>
                          <Input {...methods.register(`integrantes.${idx}.apellido` as const)} />
                          <FieldError message={memErrors?.apellido?.message} />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex flex-col gap-1 sm:w-2/3">
                          <Label>Correo {idx === 0 ? "(Lider del equipo)" : ""}</Label>
                          <Input {...methods.register(`integrantes.${idx}.correo` as const)} placeholder={isExternal ? "example@example.com" : "usuario@uninorte.edu.co"} />
                          <FieldError message={memErrors?.correo?.message} />
                        </div>
                        {!isExternal && (
                          <div className="flex flex-col gap-1 sm:w-1/3">
                            <Label>Código Estudiantil</Label>
                            <Input {...methods.register(`integrantes.${idx}.codigo_estudiantil` as const)} inputMode="numeric" placeholder="1234567890" onInput={(e) => { const input = e.currentTarget; input.value = input.value.replace(/\D/g, ""); }} />
                            <FieldError message={memErrors?.codigo_estudiantil?.message} />
                          </div>
                        )}
                      </div>

                      {!isExternal && (
                        <div className="flex flex-col gap-1">
                          <Label>NRCs del estudiante</Label>
                          <Select value={(member?.nrcIds && member.nrcIds.length > 0) ? (safeNrcs.find((n: any) => n.id === member.nrcIds![member.nrcIds!.length - 1])?.codeStr || "") : ""} onValueChange={(selectedCode: string) => {
                            if (!selectedCode) return;
                            const selectedNrcId = safeNrcs.find((n: any) => n.codeStr === selectedCode)?.id;
                            if (!selectedNrcId) return;
                            const currentNrcIds = member.nrcIds || [];
                            if (!currentNrcIds.includes(selectedNrcId)) {
                              const next = [...currentNrcIds, selectedNrcId];
                              methods.setValue(`integrantes.${idx}.nrcIds`, next);
                            }
                          }} disabled={isPageLoading}>
                            <SelectTrigger><SelectValue placeholder={isPageLoading ? "Cargando NRCs..." : safeNrcs.length ? "Selecciona NRCs" : "No hay NRCs disponibles"} /></SelectTrigger>
                            <SelectContent>
                              {safeNrcs.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">{isPageLoading ? "Cargando..." : "No hay NRCs disponibles."}</div>
                              ) : (
                                safeNrcs.filter((n: any) => !(member.nrcIds || []).includes(n.id)).map((n: any) => <SelectItem key={n.id} value={n.codeStr}>{n.label}</SelectItem>)
                              )}
                            </SelectContent>
                          </Select>

                          {member.nrcIds && member.nrcIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {member.nrcIds.map((nrcId: number) => {
                                const nrcInfo = safeNrcs.find((n: any) => n.id === nrcId);
                                if (!nrcInfo) return null;
                                return (
                                  <div key={nrcId} className="flex items-center space-x-1 rounded-full border border-input bg-muted px-3 py-1 text-sm hover:bg-muted/70 transition">
                                    <span>{nrcInfo.codeStr}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0 text-destructive hover:bg-destructive/10" onClick={() => {
                                      const currentIds = member.nrcIds || [];
                                      const next = currentIds.filter((id: number) => id !== nrcId);
                                      methods.setValue(`integrantes.${idx}.nrcIds`, next);
                                    }}>✕</Button>
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

            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { if (fields.length >= 10) { toast.error("Máximo 10 miembros por equipo"); return; } append({ nombre: "", apellido: "", correo: "", codigo_estudiantil: "", nrcIds: [] }); setTimeout(() => setEditingIndex(fields.length), 0); }}>
              <Plus className="w-4 h-4 mr-2" /> Agregar miembro
            </Button>
          </div>
        </div>
      )}

      <ImageCropper file={selectedLogoFile} open={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={handleCroppedLogo} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        <div className="flex w-full sm:w-auto gap-2 flex-col-reverse sm:flex-row">
          {step > 1 && (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setStep((s: number) => Math.max(1, s - 1))} disabled={busy}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
          )}

          {step === 1 ? (
            <Button type="button" onClick={(e) => { e.preventDefault(); nextFromStep1(); console.log("aditional", methods.watch("videojuego.additionalImages"), methods.watch("videojuego.logo_url")); }} className="w-full sm:w-auto" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />

            </Button>
          ) : step === 2 ? (
            <Button type="button" onClick={(e) => { e.preventDefault(); nextFromStep2(); }} className="w-full sm:w-auto" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />

            </Button>
          ) : (
            <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {methods.watch("mode") === "add" ? "Registrar" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
