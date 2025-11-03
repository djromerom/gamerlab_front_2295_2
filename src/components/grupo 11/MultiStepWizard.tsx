/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { MultiFormProvider } from "@/contexts/MultiFormContext";
import StepRenderer from "./StepRenderer";
import { CombinedFormValues, CombinedSchema } from "@/lib/schemas";
import { useState, useEffect } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useNavigate } from "react-router-dom";
import { uploadImage, getImageUrl } from "@/components/grupo 11/azureFile";

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
      YoutubeUrl: "",
      RepoUrl: "",
      description: "",
      
      files: [] as File[],
      recaptcha: "",
    },
  });
  
  // Set default values only once on mount
  useEffect(() => {
    methods.reset({
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
       YoutubeUrl: "",
      RepoUrl: "",
      description: "",
     
      files: [] as File[],
      recaptcha: "",
    });
  }, []); // Empty dependency array = runs only once on mount
  
  async function onSubmit(data: CombinedFormValues) {
    const res = await fetch(
      `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/videogame/${data.gameName
      }`
    );
    const exists = await res.json();
    if (exists === true) {
      toast.error("El nombre del videojuego ya está en uso.");
      return;
    }

    setIsLoading(true);
    const preUploadedUrls = (data as any).uploadedFileUrls as string[] | undefined;
    const willUploadFiles = !preUploadedUrls || preUploadedUrls.length === 0;

    const uploadToastId = willUploadFiles && data.files && data.files.length > 0
      ? toast.loading("Subiendo archivos...")
      : undefined;

    try {
      const uploadedFileUrls: string[] = [];

      // If the step already uploaded files and stored their URLs in the form
      // (e.g. MembersStep executed uploads), prefer those and skip uploading again.
      if (preUploadedUrls && preUploadedUrls.length > 0) {
        uploadedFileUrls.push(...preUploadedUrls);
      } else if (data.files && data.files.length > 0) {

        console.log("Uploading file to Azure...");
        console.log('TAMAÑO DEL FILE:', data.files.length);

        for (const file of data.files) {
          const uploadResult = await uploadImage(file);
          const urlResult = await getImageUrl(uploadResult.id);
          uploadedFileUrls.push(urlResult.url);
        }

        if (uploadToastId) {
          toast.success("Archivos subidos correctamente", {
            id: uploadToastId,
          });
        }
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
          videoUrl: data.YoutubeUrl || "",
          repoUrl: data.RepoUrl || "",
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