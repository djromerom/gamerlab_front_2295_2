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
      // Tus valores por defecto, ejemplo:
      teamName: "",
      members: [{ nombre: "", correo: "", codigoEstudiantil: "", nrc: [] }],
      gameName: "",
      description: "",
      files: undefined, // Inicializa como undefined
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
        console.log(`Subiendo ${data.files.length} archivos...`);

        const uploadPromises = Array.from(data.files).map(async (file) => {
          const filePath = `uploads/${Date.now()}-${file.name.replace(
            /\s+/g,
            "_"
          )}`;

          console.log(`Subiendo archivo: ${file.name} a la ruta: ${filePath}`);

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            console.error(`Error subiendo ${file.name}:`, uploadError);
            throw new Error(
              `Error al subir el archivo ${file.name}: ${uploadError.message}`
            );
          }

          // 2. Obtener la URL pública del archivo subido
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

          if (!urlData?.publicUrl) {
            console.warn(
              `No se pudo obtener la URL pública para: ${filePath}. Asegúrate que el bucket '${BUCKET_NAME}' sea público o que existan políticas RLS adecuadas.`
            );
            return null; // No añade la URL si no se pudo obtener
          }

          console.log(
            `Archivo subido: ${file.name}, URL: ${urlData.publicUrl}`
          );
          return urlData.publicUrl;
        });

        const results = await Promise.all(uploadPromises);
        uploadedFileUrls.push(
          ...results.filter((url): url is string => url !== null)
        );

        // Mensaje de éxito para la subida (si hubo archivos)
        if (uploadToastId) {
          if (uploadedFileUrls.length === data.files.length) {
            toast.success("Archivos subidos con éxito.", { id: uploadToastId });
          } else {
            toast.warning(
              "Algunos archivos no pudieron ser procesados completamente.",
              { id: uploadToastId }
            );
          }
        }
      } else {
        console.log("No hay archivos para subir.");
        // No necesitamos toast de carga si no hay archivos
      }

      // 3. Preparar los datos (payload)
      const payload = {
        teamName: data.teamName,
        members: data.members.map((m) => ({
          memberName: m.nombre,
          memberEmail: m.correo,
          studentCode: m.codigoEstudiantil,
          nrc: Array.isArray(m.nrc) ? m.nrc : [m.nrc], // asegúrate que es array
        })),
        videogame: {
          vgName: data.gameName,
          description: data.description,
          logoURL: uploadedFileUrls[0] || "", // solo 1 archivo
        },
      };

      try {
        const res = await customFetch("http://localhost:3000/teams", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        console.log("Respuesta del servidor:", res.status);
        // Regresar a la página de inscripción al torneo si el registro fue exitoso
        if (res.status === 201) {
          navigate("/registro-equipo");
          console.log("Registro exitoso, redirigiendo...");
        } else {
          const errorBody = await res.json();
          throw new Error(
            `Error ${res.status}: ${errorBody.message || "Error desconocido"}`
          );
        }

      } catch (error) {
        console.error("Error al enviar el payload:", error);
        toast.error("Error al enviar el payload", {
          description: "Ocurrió un error inesperado.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error en el proceso onSubmit:", error);
      if (uploadToastId) {
        toast.dismiss(uploadToastId); // Cierra el toast de carga si falló
      }
      toast.error("Error al procesar el formulario", {
        description: error.message || "Ocurrió un error inesperado.",
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
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <StepRenderer />
            {/* Ejemplo de botón de submit fuera del StepRenderer
               (ajústalo si tu botón está dentro de un paso específico) */}
            {/* <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                 {isLoading ? 'Procesando...' : 'Enviar Formulario'}
                </Button>
            </div> */}
          </form>
        </Form>
      </FormProvider>
    </MultiFormProvider>
  );
}
