"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropperModalProps {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  onCropComplete: (croppedFile: File) => void
}

export function ImageCropperModal({ isOpen, onClose, imageFile, onCropComplete }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgSrc, setImgSrc] = useState<string>("")

  // Load image when file changes
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget) {
      const { width, height } = e.currentTarget

      // Create a centered square crop
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          1, // 1:1 aspect ratio
          width,
          height,
        ),
        width,
        height,
      )

      setCrop(crop)
    }
  }, [])

  // Set up image when modal opens
  const setupImage = useCallback(() => {
    if (!imageFile) return

    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "")
      setScale(1)
      setRotate(0)
    })
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Reset when modal closes
  const handleClose = () => {
    setImgSrc("")
    setCrop(undefined)
    setCompletedCrop(undefined)
    onClose()
  }

  // Generate cropped image
  const generateCroppedImage = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height

    // Set canvas size to the cropped size
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    // Apply transformations
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotate * Math.PI) / 180)
    ctx.scale(scale, scale)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    // Draw the cropped image
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    )

    ctx.restore()

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob || !imageFile) return

      // Create a new file from the blob
      const croppedFile = new File([blob], imageFile.name, {
        type: imageFile.type,
        lastModified: Date.now(),
      })

      onCropComplete(croppedFile)
      handleClose()
    }, imageFile?.type)
  }, [completedCrop, imageFile, onCropComplete, rotate, scale])

  // Initialize image when modal opens
  if (isOpen && imageFile && !imgSrc) {
    setupImage()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recortar imagen</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {imgSrc && (
            <>
              <div className="relative max-w-full overflow-hidden rounded-md">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc || "/placeholder.svg"}
                    alt="Imagen para recortar"
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxWidth: "100%",
                      maxHeight: "60vh",
                    }}
                    onLoad={onImageLoad}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>

              <div className="w-full space-y-4">
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4" />
                  <Slider
                    value={[scale]}
                    min={0.5}
                    max={3}
                    step={0.01}
                    onValueChange={(value) => setScale(value[0])}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4" />
                </div>

                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRotate((prev) => prev - 90)}>
                    <RotateCw className="h-4 w-4 mr-1 rotate-[-90deg]" />
                    Rotar -90°
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRotate((prev) => prev + 90)}>
                    <RotateCw className="h-4 w-4 mr-1" />
                    Rotar 90°
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={generateCroppedImage}>Aplicar recorte</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
