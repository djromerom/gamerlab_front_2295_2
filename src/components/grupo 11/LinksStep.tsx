"use client";

import { useRef } from "react";
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
import { CloudUpload, X } from "lucide-react";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { useFormContext } from "react-hook-form";
import type { CombinedFormValues } from "@/lib/schemas";

export default function LinksStep() {
  const { back } = useMultiForm();
  const { control, setValue, watch } = useFormContext<CombinedFormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFiles = watch("additionalFiles") || [];

  // Manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalFiles = currentFiles.length + newFiles.length;
    
    if (totalFiles > 5) {
      alert("Máximo 5 fotos permitidas");
      return;
    }

    setValue("additionalFiles", [...currentFiles, ...newFiles]);
    e.target.value = "";
  };

  // Eliminar archivo específico
  const handleDeleteFile = (index: number) => {
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    setValue("additionalFiles", updatedFiles);
  };

  return (
    <>
      <h2 className="text-xl font-medium">Enlaces y Fotos Opcionales</h2>
      <p className="text-gray-600 mb-6">
        Puedes agregar enlaces a un video de YouTube, tu repositorio de código y fotos adicionales del proyecto. Todos estos campos son completamente opcionales.
      </p>

      <FormField
        control={control}
        name="YoutubeUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL de YouTube (opcional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                placeholder="https://www.youtube.com/watch?v=..."
                type="text"
              />
            </FormControl>
            <FormDescription>
              Video promocional o gameplay de tu videojuego
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="RepoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL del Repositorio (opcional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                placeholder="https://github.com/usuario/proyecto"
                type="text"
              />
            </FormControl>
            <FormDescription>
              Enlace al repositorio de GitHub, GitLab, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="additionalFiles"
        render={() => (
          <FormItem>
            <FormLabel>Fotos del Proyecto (opcional)</FormLabel>
            <FormDescription>
              Sube hasta 5 fotos que muestren tu videojuego (capturas de pantalla, gameplay, etc.)
            </FormDescription>
            <FormControl>
              <div className="space-y-4">
                {/* Área para arrastrar o seleccionar archivos */}
                <div
                  className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload className="h-8 w-8 mb-2 text-gray-400" />
                  <p className="text-center text-sm text-gray-600">
                    Haz clic para seleccionar fotos o arrastra aquí
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Máximo 5 imágenes • PNG, JPG, JPEG
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Lista de archivos seleccionados */}
                {currentFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative group"
                      >
                        <div className="aspect-square overflow-hidden rounded-lg border">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-center mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {currentFiles.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    No hay fotos seleccionadas.
                  </p>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between space-x-4 pt-6">
        <Button
          type="button"
          className="cursor-pointer"
          variant="outline"
          onClick={back}
        >
          Atrás
        </Button>
        
        <Button 
          variant="home" 
          type="submit"
        >
          Enviar
        </Button>
      </div>
    </>
  );
}