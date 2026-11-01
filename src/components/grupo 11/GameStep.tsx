"use client";

import type React from "react";

import { useState, useRef } from "react";
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
import { CloudUpload } from "lucide-react";
import { useMultiForm } from "@/contexts/MultiFormContext";
import { useFormContext } from "react-hook-form";
import type { CombinedFormValues } from "@/lib/schemas";
import { ImageCropper } from "./ImageCropper";
import { apiFetch } from "@/lib/api";
import { nameCheckUrl } from "@/lib/registration";
import { toast } from "sonner";

export default function GameStep() {
  const { back, next } = useMultiForm();
  const { control, setValue, watch, setError, clearErrors } =
    useFormContext<CombinedFormValues>();
  const [fileError, setFileError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFiles = watch("files") || [];

  // Estado para el modal de recorte
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Procesar archivo (común para click y drag & drop)
  const processFile = (file: File) => {
    setSelectedFile(file);
    setCropperOpen(true);
  };

  // Manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFile(files[0]);
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
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
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      processFile(files[0]);
    }
  };

  // Manejar la imagen recortada
  const handleCroppedImage = (croppedFile: File) => {
    setValue("files", [croppedFile]);
    clearErrors("files");
    setFileError(false);
  };

  const [checkingName, setCheckingName] = useState(false);

  // Validar antes de avanzar
  const handleNext = async () => {
    const gameName = watch("gameName");
    const description = watch("description");
    let hasErrors = false;
    
    // Validar nombre del videojuego
    if (!gameName || gameName.trim().length === 0) {
      setError("gameName", {
        type: "manual",
        message: "El nombre del videojuego es requerido",
      });
      hasErrors = true;
    } else if (gameName.trim().length > 30) {
      setError("gameName", {
        type: "manual",
        message: "El nombre no puede tener más de 30 caracteres",
      });
      hasErrors = true;
    } else {
      clearErrors("gameName");
    }
    
    // Validar logo (obligatorio)
    if ((watch("files") || []).length === 0) {
      setError("files", {
        type: "manual",
        message: "El logo del videojuego es obligatorio",
      });
      hasErrors = true;
    } else {
      clearErrors("files");
    }

    // Validar descripción
    if (!description || description.trim().length === 0) {
      setError("description", {
        type: "manual",
        message: "La descripción del videojuego es requerida",
      });
      hasErrors = true;
    } else {
      clearErrors("description");
    }
    
    if (hasErrors) return;

    // BG-06: el nombre repetido se avisa aquí y no recién al enviar en el paso 4
    setCheckingName(true);
    try {
      const res = await apiFetch(
        nameCheckUrl(import.meta.env.VITE_ENDPOINT_BACKEND, "videogame", gameName)
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      if ((await res.json()) === true) {
        setError("gameName", {
          type: "manual",
          message: "Ya existe un videojuego con este nombre. Por favor elige otro.",
        });
        return;
      }
      next();
    } catch {
      toast("Error de red", {
        description: "No se pudo verificar el nombre del videojuego.",
      });
    } finally {
      setCheckingName(false);
    }
  };

  // Eliminar archivo
  const handleDeleteFile = () => {
    setValue("files", []);
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
              <div className="flex flex-col">
                <Input
                  {...field}
                  placeholder="Escribe el nombre del videojuego"
                  maxLength={30}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                    
                    // Validación en tiempo real
                    if (value.length === 0) {
                      setError("gameName", {
                        type: "manual",
                        message: "El nombre del videojuego es requerido",
                      });
                    } else if (value.length > 30) {
                      setError("gameName", {
                        type: "manual",
                        message: "El nombre no puede tener más de 30 caracteres",
                      });
                    } else {
                      clearErrors("gameName");
                    }
                  }}
                  className={`${
                    field.value?.length > 30 ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                <div className="flex justify-end mt-1 text-xs text-muted-foreground">
                  <span className={field.value?.length > 30 ? 'text-red-500' : ''}>
                    {field.value?.length || 0}/30 caracteres
                  </span>
                </div>
              </div>
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
              <div className="flex flex-col">
                <textarea
                  placeholder="Escribe la descripción del videojuego"
                  {...field}
                  rows={4}
                  maxLength={300}
                  className={`w-full rounded border px-3 py-2 ${
                    !field.value || field.value.trim().length === 0 ? 'border-gray-300' : ''
                  }`}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                    
                    // Validación en tiempo real
                    if (!value || value.trim().length === 0) {
                      setError("description", {
                        type: "manual",
                        message: "La descripción del videojuego es requerida",
                      });
                    } else {
                      clearErrors("description");
                    }
                  }}
                />
                <div className="flex justify-end mt-1 text-xs text-muted-foreground">
                  {field.value?.length || 0}/300 caracteres
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="files"
        render={() => (
          <FormItem>
            <FormLabel>
              Logo del videojuego <span className="text-red-400">(obligatorio)</span>
            </FormLabel>
            <FormDescription>
              Una imagen cuadrada de hasta 1 MB. Sin logo no se puede continuar.
            </FormDescription>
            <FormControl>
              <div className="space-y-2">
                {/* Área para arrastrar o seleccionar archivos */}
                <div
                  className={`flex flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors cursor-pointer ${
                    isDragOver 
                      ? 'border-[#AC7CFF] bg-[#AC7CFF]/10' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CloudUpload className="h-8 w-8 mb-2" />
                  <p>Arrastra o haz clic para seleccionar una imagen</p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Lista de archivos */}
                {currentFiles.length > 0 && (
                  <div className="space-y-2">
                    {currentFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md border p-2"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md">
                          <img
                            src={
                              URL.createObjectURL(file) || "/placeholder.svg"
                            }
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 truncate">
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="home"
                          size="icon"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile();
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {fileError && (
                  <p className="text-red-500 text-sm mt-1">
                    La imagen debe ser cuadrada (1:1)
                  </p>
                )}

                {currentFiles.length === 0 && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    No hay archivos seleccionados.
                  </p>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex justify-between space-x-4 pt-4">
        <Button
          type="button"
          className="cursor-pointer"
          variant="outline"
          onClick={back}
        >
          Atrás
        </Button>

        <Button variant="home" type="button" onClick={handleNext} disabled={checkingName}>
          {checkingName ? "Verificando..." : "Siguiente"}
        </Button>
      </div>

      {/* Modal de recorte de imagen */}
      <ImageCropper
        file={selectedFile}
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCroppedImage}
      />
    </>
  );
}
