"use client"

import type React from "react"

import { useState, useRef } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export const INVALID_IMAGE_MESSAGE =
  "El archivo no es una imagen válida. Elige una imagen PNG, JPG o WEBP."

export function ImageCropper({
  file,
  open,
  onClose,
  onCropComplete,
}: {
  file: File | null
  open: boolean
  onClose: () => void
  onCropComplete: (file: File) => void
}) {
  const [crop, setCrop] = useState<Crop>()
  const [imgSrc, setImgSrc] = useState<string>("")
  // Mensaje si el archivo no se puede abrir como imagen (por ejemplo, otro archivo renombrado a .png)
  const [error, setError] = useState<string>("")
  const imgRef = useRef<HTMLImageElement>(null)

  // Cargar la imagen cuando cambia el archivo
  if (file && open && !imgSrc && !error) {
    if (file.type && !file.type.startsWith("image/")) {
      setError(INVALID_IMAGE_MESSAGE)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImgSrc(e.target?.result as string)
      }
      reader.onerror = () => setError(INVALID_IMAGE_MESSAGE)
      reader.readAsDataURL(file)
    }
  }

  // Reiniciar cuando se cierra el modal
  const handleClose = () => {
    setImgSrc("")
    setCrop(undefined)
    setError("")
    onClose()
  }

  // El navegador no pudo decodificar el archivo: no es una imagen real
  const onImageError = () => {
    setCrop(undefined)
    setError(INVALID_IMAGE_MESSAGE)
  }

  // Cuando se carga la imagen, establecer el recorte inicial
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1, // Relación de aspecto 1:1
        width,
        height,
      ),
      width,
      height,
    )
    setCrop(crop)
  }

  // Aplicar el recorte
  const handleCrop = () => {
    if (error || !imgRef.current || !crop || !file) return

    const canvas = document.createElement("canvas")
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height
    const pixelRatio = window.devicePixelRatio

    // Calcular dimensiones del recorte
    const cropWidth = crop.width * (imgRef.current.width / 100)
    const cropHeight = crop.height * (imgRef.current.height / 100)
    const cropX = crop.x * (imgRef.current.width / 100)
    const cropY = crop.y * (imgRef.current.height / 100)

    // Configurar el canvas
    canvas.width = cropWidth * pixelRatio
    canvas.height = cropHeight * pixelRatio

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Aplicar escala para alta resolución
    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = "high"

    // Dibujar la imagen recortada
    ctx.drawImage(
      imgRef.current,
      cropX * scaleX,
      cropY * scaleY,
      cropWidth * scaleX,
      cropHeight * scaleY,
      0,
      0,
      cropWidth,
      cropHeight,
    )

    // Convertir a blob y crear archivo
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError(INVALID_IMAGE_MESSAGE)
          return
        }

        // Crear nuevo archivo con la imagen recortada
        const croppedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        })

        onCropComplete(croppedFile)
        handleClose()
      },
      file.type,
      1, // Calidad máxima
    )
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recortar imagen</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          {imgSrc && !error && (
            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} aspect={1} circularCrop={true}>
              <img
                ref={imgRef}
                src={imgSrc || "/placeholder.svg"}
                alt="Imagen para recortar"
                onLoad={onImageLoad}
                onError={onImageError}
                className="max-h-[400px] max-w-full"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          )}
          {!error && (
            <p className="text-sm text-muted-foreground mt-2">Ajusta la imagen para que quede circular</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleCrop} disabled={!!error || !crop}>
            Aplicar recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
