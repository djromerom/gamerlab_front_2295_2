import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CloudUpload, X } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ImageCropper } from "../grupo 11/ImageCropper"

import { TeamVideogameProps } from "@/types/teamVideogames";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { useFormContext } from "react-hook-form"
import { useEffect, useRef, useState } from "react"
import { useMultiForm } from "@/contexts/MultiFormContext"
import { CombinedFormValues } from "@/lib/schemas"
import { getImageUrl, uploadImage } from "../grupo 11/azureFile"

export default function FormEditVideogame (
    {
        edit, setEdit, 
        infoEquipo, setInfoEquipo, 
        infoEditEquipo, setInfoEditEquipo, 
        fileInputRef, 
        currentFiles, 
        fileError, 
        selectedFile, 
        cropperOpen, setCropperOpen, 
        additionalImages, setAdditionalImages,
        handleFileChange, handleDeleteFile, uploadInfoTeam, handleCroppedImage 
    } : TeamVideogameProps) {
    
    const [isDragOver, setIsDragOver] = useState(false); 
    const fileInputRefImages = useRef<HTMLInputElement | null>(null);

    // Procesar archivos (común para click y drag & drop) 

    const processFiles = (files: FileList | File[]) => { 
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/')); 
        const totalFiles = additionalImages.length + newFiles.length; 
        if (totalFiles > 5) { 
            alert("Máximo 5 fotos permitidas"); 
            return; 
        } 
        setAdditionalImages(prev => [...prev, ...newFiles])
    }; 

    // Manejar la selección de archivos 
    const handleFileChangeImages = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const files = e.target.files; 
        console.log('Esta es una imagen: ', files)
        if (!files || files.length === 0) return; 
        processFiles(files); 
        e.target.value = ""; 

        console.log("Estas son las nuevas imagenes", additionalImages)
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
    const handleDeleteFileImage = (index: number) => { 
        setAdditionalImages(prev => prev.filter((_, i) => i !== index))
    }; 

    useEffect(() => {
  console.log("✅ Nuevas imágenes guardadas:", additionalImages);
}, [additionalImages]);

    return (
        <>
            <Dialog open={!!edit} onOpenChange={() => {!open; setEdit(null)}}>
                <DialogContent className="self-center w-full m-auto max-h-[80vh] overflow-y-auto">
                
                    <DialogHeader>
                        <DialogTitle>Editar equipo {infoEquipo?.teamName}</DialogTitle>
                        <DialogDescription>
                        Edita los datos del equipo y el juego.
                        </DialogDescription>
                    </DialogHeader>


                    <div className="space-y-8 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <Label>Nombre del equipo</Label>
                                <Input
                                value={infoEditEquipo?.teamName}
                                onChange={(e) => setInfoEditEquipo((prev) => ({...prev, teamName: e.target.value}))}
                                placeholder="Nombre del equipo"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Nombre del juego</Label>
                                <Input
                                value={infoEditEquipo.videogameName}
                                onChange={(e) => setInfoEditEquipo((prev) => ({...prev, videogameName: e.target.value}))}
                                placeholder="Mi juego"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Description</Label>
                            <Textarea className={"flex resize-none"} value={infoEditEquipo.description} onChange={(e) => setInfoEditEquipo((prev) => ({...prev, description: e.target.value}))} placeholder={"Escribe una descripción del juego"} style={{height:80}}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>
                                Cambiar logo
                            </Label>
                            <div
                                className="flex flex-col items-center justify-center rounded-md border border-dashed p-4 transition-colors hover:bg-muted/50 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <CloudUpload className="h-8 w-8" />
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
                                <div className="space-y-2 w-full contain-inline-size">
                            
                                    {currentFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 rounded-md border p-2"
                                        >
                                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md">
                                                <img
                                                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                                                    alt={file.name}
                                                    className="h-full w-full"
                                                />
                                            </div>
                                            <div className="flex-1 truncate">
                                                <div className="text-sm font-medium">{file.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </div>
                                            </div>
                                            <Button
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <Label>Vídeo de youtube</Label>
                                <Input
                                    value={infoEditEquipo?.videoUrl}
                                    onChange={(e) => setInfoEditEquipo((prev) => ({...prev, videoUrl: e.target.value}))}
                                    placeholder="https://youtube..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Repositorio Github</Label>
                                <Input
                                    value={infoEditEquipo.repoUrl}
                                    onChange={(e) => setInfoEditEquipo((prev) => ({...prev, repoUrl: e.target.value}))}
                                    placeholder="https://github..."
                                />
                            </div>
                        </div>


                        {/*IMÁGENES ADICIONALES HASTA 5*/}
                        {/* 📸 Imágenes adicionales */}
                        <div className="space-y-4">
                            <Label>Fotos del proyecto</Label>
                            <p className="text-sm text-gray-500">
                                Sube hasta 5 fotos que muestren tu videojuego.
                            </p>

                            <div className={`flex flex-col items-center justify-center rounded-md border border-dashed p-6 transition-colors cursor-pointer 
                                ${
                                    isDragOver ? "border-[#AC7CFF] bg-[#AC7CFF]/10" : "hover:bg-muted/50"
                                }`}
                                onClick={() => fileInputRefImages.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <CloudUpload className="h-8 w-8 mb-2 text-gray-400" />
                                <p className="text-center text-sm text-gray-600">
                                    Haz clic para subir una imagen
                                </p>
                                <Input
                                    ref={fileInputRefImages}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChangeImages}
                                    className="hidden"
                                />
                            </div>
                        
                            {additionalImages.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {additionalImages.map((file, index) => (
                                        <div key={index} className="relative group">
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
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDeleteFileImage(index)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                            <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center">
                                    No hay fotos seleccionadas.
                                </p>
                            )}
            
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={ ()=>setEdit(false) }
                        >
                            Cancelar
                        </Button>
                        <Button onClick={async () => { 
                            await uploadInfoTeam();
                            await setInfoEquipo(infoEditEquipo); 
                            setEdit(false)}}>
                                Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ImageCropper
                file={selectedFile}
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                onCropComplete={handleCroppedImage}
            />
        </>
    )
}