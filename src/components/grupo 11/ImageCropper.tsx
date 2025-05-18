"use client"

import type React from "react"

import { useState, useRef } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
  const imgRef = useRef<HTMLImageElement>(null)

  // Cargar la imagen cuando cambia el archivo
  if (file && open && !imgSrc) {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImgSrc(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Reiniciar cuando se cierra el modal
  const handleClose = () => {
    setImgSrc("")
    setCrop(undefined)
    onClose()
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
    if (!imgRef.current || !crop || !file) return

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
        if (!blob) return

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
          {imgSrc && (
            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} aspect={1} circularCrop={false}>
              <img
                ref={imgRef}
                src={imgSrc || "/placeholder.svg"}
                alt="Imagen para recortar"
                onLoad={onImageLoad}
                style={{ maxHeight: "400px", maxWidth: "100%" }}
                crossOrigin="anonymous"
              />
            </ReactCrop>
          )}
          <p className="text-sm text-muted-foreground mt-2">Ajusta la imagen para que quede cuadrada (1:1)</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleCrop}>Aplicar recorte</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
