import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CloudUpload } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ImageCropper } from "../grupo 11/ImageCropper"

import { TeamVideogameProps } from "@/types/teamVideogames";

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
        handleFileChange, handleDeleteFile, uploadInfoTeam, handleCroppedImage 
    } : TeamVideogameProps) {
    return (
        <>
            <Dialog open={!!edit} onOpenChange={() => {!open; setEdit(null)}}>
                <DialogContent  className="max-w-md w-full">
                
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
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={async () => { setInfoEditEquipo(infoEquipo); handleDeleteFile(); setEdit(false) }}
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