import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadPhotos, deletePhotos, validateImageFile } from "@/api/editions";

interface GalleryUploadProps {
  editionId: number;
  existingPhotos?: { id: string; url: string }[];
  onSuccess?: () => void; // para refrescar datos del padre
}

export const GalleryUpload: React.FC<GalleryUploadProps> = ({
  editionId,
  existingPhotos = [],
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const validImages: { file: File; preview: string }[] = [];

    for (const file of files) {
      const error = validateImageFile(file);
      if (error) {
        toast.error("Archivo inválido", { description: error });
        continue;
      }
      validImages.push({ file, preview: URL.createObjectURL(file) });
    }

    if (validImages.length > 0) {
      // Revisar límite 50 fotos
      const total = existingPhotos.length + newImages.length + validImages.length;
      if (total > 50) {
        toast.error("Límite alcanzado", { description: `No puedes tener más de 50 fotos por edición. Actualmente hay ${existingPhotos.length} subidas y ${newImages.length} en cola.` });
        validImages.forEach(img => URL.revokeObjectURL(img.preview));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      
      // Revisar límite 20 fotos por chunk
      if (newImages.length + validImages.length > 20) {
        toast.error("Límite por carga", { description: `Solo puedes subir hasta 20 fotos a la vez. Actualmente tienes ${newImages.length} en cola y estás intentando agregar ${validImages.length} más.` });
        validImages.forEach(img => URL.revokeObjectURL(img.preview));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setNewImages(prev => [...prev, ...validImages]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (newImages.length === 0) return;

    try {
      setUploading(true);
      await uploadPhotos(editionId, newImages.map(img => img.file));

      toast.success("Galería actualizada", { description: `${newImages.length} foto${newImages.length !== 1 ? "s" : ""} agregada${newImages.length !== 1 ? "s" : ""} correctamente.` });

      newImages.forEach(img => URL.revokeObjectURL(img.preview));
      setNewImages([]);
      onSuccess?.();
    } catch (err: any) {
      toast.error("Error al subir fotos", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExisting = async (uploadId: string) => {
    setDeletingIds(prev => new Set(prev).add(uploadId));
    try {
      await deletePhotos(editionId, [uploadId]);
      toast.success("Foto eliminada");
      onSuccess?.();
    } catch (err: any) {
      toast.error("Error al eliminar foto", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(uploadId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Fotos existentes en el servidor */}
      {existingPhotos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Fotos actuales ({existingPhotos.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {existingPhotos.map(photo => (
              <div
                key={photo.id}
                className="relative group rounded-md overflow-hidden border border-gray-700 bg-[#060312] aspect-video"
              >
                <img
                  src={photo.url}
                  alt="Foto de galería"
                  className="w-full h-full object-cover"
                />
                {/* Overlay con botón eliminar */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {deletingIds.has(photo.id) ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <button
                      onClick={() => handleDeleteExisting(photo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {existingPhotos.length === 0 && newImages.length === 0 && (
        <div className="text-sm text-gray-500 italic p-6 text-center border border-dashed border-gray-800 rounded-lg">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-700" />
          No hay fotos en la galería todavía.
        </div>
      )}

      {/* Cola de nuevas fotos para subir */}
      {newImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Listas para subir ({newImages.length} / 20) — {(newImages.reduce((acc, curr) => acc + curr.file.size, 0) / (1024 * 1024)).toFixed(2)} MB
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {newImages.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-md overflow-hidden border border-[#AC7CFF]/30 bg-[#060312] aspect-video"
              >
                <img
                  src={img.preview}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removeNewImage(idx)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Quitar de la cola"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-800">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-dashed border-2 border-gray-700 bg-[#060312] hover:bg-gray-900 text-gray-300 min-h-[44px]"
        >
          <Upload className="w-4 h-4 mr-2 text-[#AC7CFF]" />
          Agregar fotos
        </Button>

        {newImages.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-[#AC7CFF] hover:bg-[#8A5CD6] text-black font-semibold min-h-[44px]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              `Subir ${newImages.length} foto${newImages.length !== 1 ? "s" : ""}`
            )}
          </Button>
        )}

        <p className="text-xs text-gray-500 ml-auto">
          Puedes subir hasta 25 MB a la vez
        </p>
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
      />
    </div>
  );
};
