/* eslint-disable @typescript-eslint/no-explicit-any */
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

const BUCKET_NAME = "image";

export default function MultiStepWizard() {
  const [isLoading, setIsLoading] = useState(false);
  const customFetch = useFetch();
  const navigate = useNavigate();
  const methods = useForm<CombinedFormValues>({
    resolver: zodResolver(CombinedSchema) as any, // Type assertion to bypass resolver type issue
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
      files: [] as File[],
      recaptcha: "",
    },
  });

  async function onSubmit(data: CombinedFormValues) {
    const res = await fetch(
      `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/videogame/${
        data.gameName
      }`
    );
    const exists = await res.json();
    if (exists === true) {
      toast.error("El nombre del videojuego ya está en uso.");
      return;
    }

    setIsLoading(true);
    const uploadToastId =
      data.files && data.files.length > 0
        ? toast.loading("Subiendo archivos...")
        : undefined;

    try {
      const uploadedFileUrls: string[] = [];
      if (data.files && data.files.length > 0) {

        const uploads = Array.from(data.files).map(async (file) => {

          const formData = new FormData();
          formData.append(BUCKET_NAME, file);

          const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (!response.ok){
            throw new Error(`Error al subir ${file.name}`);
          }
          return data

        });
        (await Promise.all(uploads)).filter((u): u is string => !!u)
        .forEach((u) => uploadedFileUrls.push(u));
        
      //   const uploads = Array.from(data.files).map(async (file) => {
      //     const path = `uploads/${Date.now()}-${file.name.replace(
      //       /\s+/g,
      //       "_"
      //     )}`;
      //     const { error: uploadError } = await supabase.storage
      //       .from(BUCKET_NAME)
      //       .upload(path, file, { cacheControl: "3600", upsert: false });
      //     if (uploadError) throw new Error(`Error al subir ${file.name}`);
      //     const { data: urlData } = supabase.storage
      //       .from(BUCKET_NAME)
      //       .getPublicUrl(path);
      //     return urlData?.publicUrl ?? null;
      //   });
      //   (await Promise.all(uploads))
      //     .filter((u): u is string => !!u)
      //     .forEach((u) => uploadedFileUrls.push(u));
      //   if (uploadToastId)
      //     toast.success("Archivos subidos", { id: uploadToastId });
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
        recaptchaToken: data.recaptcha,
      };

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
        toast.success("Equipo registrado correctamente");
        navigate("/equipos");
      } else {
        const errorData = await response.json();
        let errorMessage = "Error en el registro";
        
        if (errorData && errorData.message) {
          // Manejar diferentes mensajes de error
          if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else if (typeof errorData.message === 'object') {
            errorMessage = Object.values(errorData.message).join(', ');
          }
        }
        
        throw new Error(errorMessage || `Error ${response.status}`);
      }
    } catch (e) {
      if (uploadToastId) toast.dismiss(uploadToastId);
      toast.error("Error en el registro", {
        description: (e as Error).message || "Error inesperado",
        duration: 5000,
      });
    } finally {
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