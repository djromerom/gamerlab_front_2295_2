import { apiFetch } from "@/lib/api";
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { MultiFormProvider, useMultiForm } from "@/contexts/MultiFormContext";
import StepRenderer from "./StepRenderer";
import { CombinedFormValues, CombinedSchema } from "@/lib/schemas";
import { useState, useEffect, useRef, type MutableRefObject } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useNavigate } from "react-router-dom";
import { uploadImage, getImageUrl } from "@/components/grupo 11/azureFile";
import {
  buildRegistrationPayload,
  cleanApiMessage,
  clearRegistrationDraft,
  loadRegistrationDraft,
  nameCheckUrl,
  saveRegistrationDraft,
} from "@/lib/registration";

const EMPTY_MEMBER = {
  nombre: "",
  apellido: "",
  correo: "",
  codigoEstudiantil: "",
  nrc: [] as string[],
};

/** Guarda en sessionStorage lo escrito y el paso actual (recargar borraba todo). */
function DraftSaver({ disabledRef }: { disabledRef: MutableRefObject<boolean> }) {
  const { step } = useMultiForm();
  const { watch, getValues } = useFormContext<CombinedFormValues>();
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
    if (!disabledRef.current) saveRegistrationDraft(step, getValues());
  }, [step, getValues, disabledRef]);

  useEffect(() => {
    const subscription = watch(() => {
      if (!disabledRef.current) saveRegistrationDraft(stepRef.current, getValues());
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, disabledRef]);

  return null;
}

export default function MultiStepWizard() {
  const [isLoading, setIsLoading] = useState(false);
  const customFetch = useFetch();
  const navigate = useNavigate();
  const [draft] = useState(() => loadRegistrationDraft());
  // Archivo → URL ya subida: si el envío falla, el reintento no vuelve a subirlo
  const uploadedUrls = useRef(new Map<File, string>());
  const submitted = useRef(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [nrcApiError, setNrcApiError] = useState<string | null>(null);

  const methods = useForm<CombinedFormValues>({
    resolver: zodResolver(CombinedSchema) as any, // Type assertion to bypass resolver type issue
    defaultValues: {
      teamName: draft?.values.teamName ?? "",
      members: draft?.values.members.length ? draft.values.members : [{ ...EMPTY_MEMBER }],
      gameName: draft?.values.gameName ?? "",
      YoutubeUrl: draft?.values.YoutubeUrl ?? "",
      RepoUrl: draft?.values.RepoUrl ?? "",
      description: draft?.values.description ?? "",
      files: [] as File[],
      additionalFiles: [] as File[],
      recaptcha: "",
      dataConsent: false,
    },
  });

  async function uploadOnce(file: File): Promise<string> {
    const cached = uploadedUrls.current.get(file);
    if (cached) return cached;
    const uploadResult = await uploadImage(file);
    const urlResult = await getImageUrl(uploadResult.id);
    uploadedUrls.current.set(file, urlResult.url);
    return urlResult.url;
  }

  async function onSubmit(data: CombinedFormValues) {
    setIsLoading(true);
    setNrcApiError(null);
    let uploadToastId: string | number | undefined;

    try {
      // Última revisión antes de subir nada (el paso 3 ya la hizo, pero otro equipo pudo tomarlo)
      const res = await apiFetch(
        nameCheckUrl(import.meta.env.VITE_ENDPOINT_BACKEND, "videogame", data.gameName)
      );
      if (res.ok && (await res.json()) === true) {
        throw new Error("El nombre del videojuego ya está en uso en esta edición. Vuelve al paso 3 y cámbialo.");
      }

      const files = [...(data.files ?? []), ...(data.additionalFiles ?? [])];
      const pending = files.filter((file) => !uploadedUrls.current.has(file));
      if (pending.length > 0) uploadToastId = toast.loading("Subiendo archivos...");

      const logoFile = data.files?.[0];
      const logoUrl = logoFile ? await uploadOnce(logoFile) : undefined;
      const additionalImages: string[] = [];
      for (const file of data.additionalFiles ?? []) {
        additionalImages.push(await uploadOnce(file));
      }

      if (uploadToastId !== undefined) {
        toast.success("Archivos subidos correctamente", { id: uploadToastId });
        uploadToastId = undefined;
      }

      const payload = buildRegistrationPayload(data, { logoUrl, additionalImages });

      const response = await customFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 201) {
        submitted.current = true;
        clearRegistrationDraft();
        toast.dismiss();
        // El alumno ve en qué estado queda la inscripción (antes un toast se perdía al navegar)
        setRegisteredEmail(payload.members[0]?.memberEmail ?? "");
        return;
      }

      const errorData = await response.json().catch(() => null);
      const apiMessage = cleanApiMessage(errorData?.message) || `Error ${response.status}`;
      const isNrcError = errorData?.field === "nrc"
        || String(apiMessage).toLowerCase().includes("nrc");
      if (isNrcError) {
        const indexedMember = Number(errorData?.memberIndex ?? errorData?.member);
        if (Number.isInteger(indexedMember) && indexedMember >= 0 && indexedMember < data.members.length) {
          methods.setError(`members.${indexedMember}.nrc`, { type: "server", message: apiMessage });
          methods.setFocus(`members.${indexedMember}.nrc`);
        } else {
          setNrcApiError(apiMessage);
        }
      }
      throw new Error(apiMessage);
    } catch (e) {
      if (uploadToastId !== undefined) toast.dismiss(uploadToastId);
      let description = e instanceof Error ? e.message : String(e);
      if (description.includes("413")) {
        description = "Uno de los archivos es demasiado grande. El tamaño máximo permitido es 1 MB.";
      }
      // El token del captcha ya se usó: hay que marcarlo otra vez antes de reintentar
      methods.setValue("recaptcha", "");
      toast.error("Error en el registro", {
        description: `${description} Corrige el dato, marca de nuevo el captcha y vuelve a enviar.`,
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (registeredEmail !== null) {
    return (
      <div className="space-y-4 py-6 text-center text-white" role="status">
        <h2 className="text-2xl font-bold">¡Equipo registrado!</h2>
        <p>
          Enviamos un correo a <strong>{registeredEmail || "el líder del equipo"}</strong> para
          confirmar la cuenta y crear la contraseña.
        </p>
        <p>
          La inscripción queda <strong>en revisión</strong> hasta que el administrador apruebe el
          videojuego. Mientras tanto, el equipo aparece como pendiente en la galería.
        </p>
        <button
          type="button"
          onClick={() => navigate("/equipos")}
          className="mt-2 rounded-lg bg-white px-4 py-2 font-medium text-[#060312] hover:bg-gray-100 cursor-pointer"
        >
          Ver videojuegos
        </button>
      </div>
    );
  }

  return (
    <MultiFormProvider initialStep={draft?.step ?? 0}>
      <FormProvider {...methods}>
        <Form {...methods}>
          <DraftSaver disabledRef={submitted} />
          {isLoading ? (
            <div className="text-center py-20 text-xl text-white animate-pulse">
              Procesando registro...
            </div>
          ) : (
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {nrcApiError && (
                <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
                  {nrcApiError}
                </div>
              )}
              <StepRenderer />
            </form>
          )}
        </Form>
      </FormProvider>
    </MultiFormProvider>
  );
}
