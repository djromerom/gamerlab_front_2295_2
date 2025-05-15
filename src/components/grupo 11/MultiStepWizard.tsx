// MultiStepWizard.tsx
"use client";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { MultiFormProvider } from "@/contexts/MultiFormContext";
import StepRenderer from "./StepRenderer";
import { CombinedFormValues, CombinedSchema } from "@/lib/schemas";
import { useState } from "react";
import supabase from "@/supabase/client";
import { useFetch } from "@/hooks/useFetch";
import { useNavigate } from "react-router-dom";

const BUCKET_NAME = "imagenes";

export default function MultiStepWizard() {
  const [isLoading, setIsLoading] = useState(false);
  const customFetch = useFetch();
  const navigate = useNavigate();
  const methods = useForm<CombinedFormValues>({
    resolver: zodResolver(CombinedSchema),
    defaultValues: {
      teamName: "",
      members: [
        {
          nombre: "",
          apellido: "",
          correo: "",
          codigoEstudiantil: "",
          nrc: [],
        },
      ],
      gameName: "",
      description: "",
      files: undefined,
      recaptcha: "",
    },
  });

  async function onSubmit(data: CombinedFormValues) {
    setIsLoading(true);
    const uploadToastId =
      data.files && data.files.length > 0
        ? toast.loading("Subiendo archivos...")
        : undefined;

    try {
      const uploadedFileUrls: string[] = [];
      if (data.files && data.files.length > 0) {
        const uploads = Array.from(data.files).map(async (file) => {
          const path = `uploads/${Date.now()}-${file.name.replace(
            /\s+/g,
            "_"
          )}`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, file, { cacheControl: "3600", upsert: false });
          if (uploadError) throw new Error(`Error al subir ${file.name}`);
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);
          return urlData?.publicUrl ?? null;
        });
        (await Promise.all(uploads))
          .filter((u): u is string => !!u)
          .forEach((u) => uploadedFileUrls.push(u));
        if (uploadToastId)
          toast.success("Archivos subidos", { id: uploadToastId });
      }

      const payload = {
        teamName: data.teamName,
        members: data.members.map((m) => ({
          memberFirstName: m.nombre,
          memberLastName: m.apellido,
          memberEmail: m.correo,
          studentCode: m.codigoEstudiantil,
          nrc: m.nrc,
        })),
        videogame: {
          vgName: data.gameName,
          description: data.description,
          logoURL: uploadedFileUrls[0] || "",
        },
      };

      const res = await customFetch(
        `http://localhost:3000/teams`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.status === 201) {
        navigate("/equipos");
      } else {
        const err = await res.json();
        throw new Error(`Error ${res.status}: ${err.message || "desconocido"}`);
      }
    } catch (e) {
      if (uploadToastId) toast.dismiss(uploadToastId);
      toast.error("Error en el registro", {
        description: (e as Error).message || "Error inesperado",
        duration: 5000,
      });
      setIsLoading(false);
    }
  }

  return (
    <MultiFormProvider>
      <FormProvider {...methods}>
        <Form {...methods}>
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
              <StepRenderer />
            </form>
          )}
        </Form>
      </FormProvider>
    </MultiFormProvider>
  );
}
