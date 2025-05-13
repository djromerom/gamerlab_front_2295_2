"use client"

import type React from "react"

import { useState, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CloudUpload } from "lucide-react"
import { useMultiForm } from "@/contexts/MultiFormContext"
import { useFormContext } from "react-hook-form"
import type { CombinedFormValues } from "@/lib/schemas"
import { ImageCropper } from "@/components/grupo 11/ImageCropper"

export default function GameStep() {
  const { back } = useMultiForm()
  const { control, setValue, watch } = useFormContext<CombinedFormValues>()
  const [fileError, setFileError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentFiles = watch("files") || []

  // Estado para el modal de recorte
  const [cropperOpen, setCropperOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Manejar la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Abrir el modal de recorte con el archivo seleccionado
    setSelectedFile(files[0])
    setCropperOpen(true)

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = ""
  }

  // Manejar la imagen recortada
  const handleCroppedImage = (croppedFile: File) => {
    setValue("files", [croppedFile])
    setFileError(false)
  }

  // Eliminar archivo
  const handleDeleteFile = () => {
    setValue("files", [])
  }

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
        render={() => (
          <FormItem>
            <FormLabel>Carga el logo</FormLabel>
            <FormDescription>Solo una imagen cuadrada de hasta 5 MB.</FormDescription>
            <FormControl>
              <div className="space-y-2">
                {/* Área para arrastrar o seleccionar archivos */}
                <div
                  className="flex flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload className="h-8 w-8 mb-2" />
                  <p>Arrastra o haz clic para seleccionar una imagen</p>
                  <input
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
                      <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md">
                          <img
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 truncate">
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFile()
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {fileError && <p className="text-red-500 text-sm mt-1">La imagen debe ser cuadrada (1:1)</p>}

                {currentFiles.length === 0 && (
                  <p className="pt-2 text-xs text-muted-foreground">No hay archivos seleccionados.</p>
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
              <ReCAPTCHA sitekey="Your-client-site-key" onChange={(val: unknown) => setValue("recaptcha", val + "")} />
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

      {/* Modal de recorte de imagen */}
      <ImageCropper
        file={selectedFile}
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCroppedImage}
      />
    </>
  )
}
