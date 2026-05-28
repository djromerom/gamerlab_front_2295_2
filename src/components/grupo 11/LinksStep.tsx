"use client";

import { useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload, X } from "lucide-react";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { useFormContext } from "react-hook-form";
import type { CombinedFormValues } from "@/lib/schemas";
import ReCAPTCHA from "react-google-recaptcha";

export default function LinksStep() {
  const { back } = useMultiForm();
  const { control, setValue, watch, setError, clearErrors } = useFormContext<CombinedFormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFiles = watch("additionalFiles") || [];
  const [isDragOver, setIsDragOver] = useState(false);

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const SITE_KEY = `${import.meta.env.VITE_SITE_KEY}`;

  // Procesar archivos (común para click y drag & drop)
  const processFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const totalFiles = currentFiles.length + newFiles.length;
    
    if (totalFiles > 5) {
      alert("Máximo 5 fotos permitidas");
      return;
    }

    setValue("additionalFiles", [...currentFiles, ...newFiles]);
  };

  // Manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFiles(files);
    e.target.value = "";
  };

  // Manejar drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Eliminar archivo específico
  const handleDeleteFile = (index: number) => {
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    setValue("additionalFiles", updatedFiles);
  };

  // Handle reCAPTCHA change - almacena solamente el token para validación en backend
  const handleRecaptchaChange = (token: string | null) => {
    if (!token) {
      setError("recaptcha", {
        type: "manual",
        message: "Por favor, complete la verificación de reCAPTCHA",
      });
      return;
    }

    // Simplemente almacenamos el token para enviarlo al backend
    setValue("recaptcha", token);
    clearErrors("recaptcha");
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
                  className={`flex flex-col items-center justify-center rounded-md border border-dashed p-6 transition-colors cursor-pointer ${
                    isDragOver 
                      ? 'border-[#AC7CFF] bg-[#AC7CFF]/10' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative group"
                      >
                        <div className="aspect-video overflow-hidden rounded-lg border">
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
                          className="cursor-pointer absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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

      <FormField
        control={control}
        name="recaptcha"
        render={() => (
          <FormItem>
            <FormLabel>Verificación de seguridad</FormLabel>
            <FormControl>
              <div>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  className="cursor-pointer"
                  sitekey={SITE_KEY}
                  onChange={handleRecaptchaChange}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="dataConsent"
        render={({ field }) => (
          <FormItem className="flex flex-col space-y-2 rounded-lg border-2 border-violet-500/50 bg-violet-500/10 p-5 shadow-sm mt-8 transition-colors hover:border-violet-500">
            <div className="flex flex-row items-start space-x-3">
              <label htmlFor="dataConsent-box" className="cursor-pointer mt-1 flex items-center justify-center">
                <Checkbox
                  id="dataConsent-box"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="cursor-pointer"
                />
              </label>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor="dataConsent-box" className="text-base cursor-pointer">
                  Tratamiento de datos personales
                </FormLabel>
                <FormDescription className="text-sm text-gray-300">
                  Acepto el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y la política de privacidad de la Universidad.
                </FormDescription>
              </div>
            </div>
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