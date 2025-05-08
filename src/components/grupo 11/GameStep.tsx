import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { CloudUpload } from "lucide-react";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { useFormContext } from "react-hook-form";
import { CombinedFormValues } from "@/lib/schemas";

export default function GameStep() {
  const { back } = useMultiForm();
  const { control, setValue, watch } = useFormContext<CombinedFormValues>();
  const [fileError, setFileError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentFiles = watch("files");

  const validateImageIsSquare = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => resolve(img.width === img.height);
      img.onerror = () => resolve(false);
    });
  };

  return (
    <>
      <FormField
        control={control}
        name="gameName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del videojuego</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Escribe el nombre del videojuego"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <textarea
                placeholder="Escribe la descripción del videojuego"
                {...field}
                rows={4}
                className="w-full rounded border px-3 py-2"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

<FormField
        control={control}
        name="files"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Carga el logo</FormLabel>
            <FormDescription>Solo una imagen cuadrada de hasta 5 MB.</FormDescription>
            <FormControl>
              <FileUpload
                value={field.value}
                onValueChange={async (files) => {
                  setFileError(false);
                  if (!files?.length) return field.onChange([]);

                  const file = files[0];
                  const isSquare = await validateImageIsSquare(file);

                  if (!isSquare) {
                    setFileError(true);
                    field.onChange([]); // Limpiar estado del form
                    const inputEl = document.querySelector('input[type="file"]') as HTMLInputElement;
                    if (inputEl) inputEl.value = "";
                    return;
                  }

                  field.onChange([file]);
                }}
                accept="image/*"
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
              >
                <FileUploadDropzone className="flex-row border-dashed">
                  <CloudUpload /> Arrastra o{" "}
                  <FileUploadTrigger asChild>
                    <Button variant="link" style={{ padding: 0 }} size="sm">
                      Selecciona un archivo
                    </Button>
                  </FileUploadTrigger>
                </FileUploadDropzone>

                <FileUploadList>
                  {(field.value ?? []).map((file, i) => (
                    <FileUploadItem key={i} value={file}>
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon">
                          ✕
                        </Button>
                      </FileUploadItemDelete>
                    </FileUploadItem>
                  ))}
                </FileUploadList>

                {fileError && (
                  <p className="text-red-500 text-sm mt-1">
                    La imagen debe ser cuadrada (1:1)
                  </p>
                )}

                {(!currentFiles || currentFiles.length === 0) && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    No hay archivos seleccionados.
                  </p>
                )}
              </FileUpload>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      
      <FormField
        control={control}
        name="recaptcha"
        render={() => (
          <FormItem>
            <FormLabel>Verificación de seguridad</FormLabel>
            <FormControl>
              <ReCAPTCHA
                sitekey="Your-client-site-key"
                onChange={(val: unknown) => setValue("recaptcha", val + "") }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-between space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={back}>
          Atrás
        </Button>

        <Button type="submit">Enviar</Button>
      </div>
    </>
  );
}
