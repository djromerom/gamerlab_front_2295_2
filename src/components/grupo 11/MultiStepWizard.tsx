// MultiStepWizard.tsx
"use client";
import * as React from "react";
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
      members: [{ nombre: "", correo: "", codigoEstudiantil: "", nrc: [] }],
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

    const uploadedFileUrls: string[] = [];

    try {
      if (data.files && data.files.length > 0) {
        const uploadPromises = Array.from(data.files).map(async (file) => {
          const filePath = `uploads/${Date.now()}-${file.name.replace(
            /\s+/g,
            "_"
          )}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw new Error(`Error al subir ${file.name}`);

          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

          if (!urlData?.publicUrl) return null;
          return urlData.publicUrl;
        });

        const results = await Promise.all(uploadPromises);
        uploadedFileUrls.push(
          ...results.filter((url): url is string => url !== null)
        );

        if (uploadToastId) {
          toast.success("Archivos subidos con éxito", { id: uploadToastId });
        }
      }

      const payload = {
        teamName: data.teamName,
        members: data.members.map((m) => ({
          memberName: m.nombre,
          memberEmail: m.correo,
          studentCode: m.codigoEstudiantil,
          nrc: Array.isArray(m.nrc) ? m.nrc : [m.nrc],
        })),
        videogame: {
          vgName: data.gameName,
          description: data.description,
          logoURL: uploadedFileUrls[0] || "",
        },
      };

      const res = await customFetch("http://localhost:3000/teams", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        navigate("/equipos");
        return; // <- NO llamamos setIsLoading(false) aquí para mantener el loading hasta redirección
      } else {
        const errorBody = await res.json();
        throw new Error(
          `Error ${res.status}: ${errorBody.message || "Error desconocido"}`
        );
      }
    } catch (error: any) {
      if (uploadToastId) toast.dismiss(uploadToastId);
      toast.error("Error en el registro", {
        description: error.message || "Error inesperado",
        duration: 5000,
      });
      setIsLoading(false); // solo desactiva loading si hay error
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
