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
import { CloudUpload} from "lucide-react";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { useFormContext } from "react-hook-form";
import { CombinedFormValues } from "@/lib/schemas";


export default function GameStep() {
  const { back } = useMultiForm();
  const { control, setValue } = useFormContext<CombinedFormValues>();

  return (
    <>
      <FormField
        control={control}
        name="gameName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del videojuego</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Escribe el nombre del videojuego" />
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
              <textarea placeholder="Escribe la descripción del videojuego" {...field} rows={4} className="w-full rounded border px-3 py-2" />
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
            <FormDescription>Solo una imagen de hasta 5 MB.</FormDescription>
            <FormControl>
              <FileUpload
                value={field.value}
                onValueChange={field.onChange}
                accept="image/*"
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
              >
                <FileUploadDropzone className="flex-row border-dashed">
                  <CloudUpload /> Arrastra o{' '}
                  <FileUploadTrigger asChild>
                    <Button variant="link" style={{padding: 0}} size="sm">Selecciona un archivo</Button>
                  </FileUploadTrigger>
                </FileUploadDropzone>
                <FileUploadList>
                  {field.value.map((file, i) => (
                    <FileUploadItem key={i} value={file}>
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon">✕</Button>
                      </FileUploadItemDelete>
                    </FileUploadItem>
                  ))}
                </FileUploadList>
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
              <ReCAPTCHA sitekey="Your-client-site-key" onChange={(val: string) => setValue('recaptcha', val || ' ' )} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between space-x-4 pt-4">
        <Button variant="outline" onClick={back}>Atrás</Button>
        <Button type="submit">Enviar</Button>
      </div>
    </>
  );
}
