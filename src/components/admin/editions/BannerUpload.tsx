import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadMainPhoto, validateImageFile } from "@/fetchs/editions";

interface BannerUploadProps {
  editionId: number;
  currentPhotoUrl?: string; // URL actual (SAS) del banner ya existente
  onSuccess?: () => void;   // Callback para refrescar el padre
}

export const BannerUpload: React.FC<BannerUploadProps> = ({
  editionId,
  currentPhotoUrl,
  onSuccess,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error("Archivo inválido", { description: error });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      await uploadMainPhoto(editionId, selectedFile);

      toast.success("Foto principal actualizada", { description: "La imagen se ha subido correctamente." });

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      onSuccess?.();
    } catch (err: any) {
      toast.error("Error al subir imagen", { description: err?.message ?? "Ocurrió un error inesperado." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // La imagen a mostrar: preview local si hay selección, o la foto actual del servidor
  const displayUrl = previewUrl ?? currentPhotoUrl ?? null;

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center bg-[#060312] text-center min-h-[200px] relative overflow-hidden"
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Banner actual"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-10 flex flex-col items-center bg-black/60 p-4 rounded-lg gap-2">
              {selectedFile ? (
                <>
                  <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpload}
                      disabled={loading}
                      className="bg-[#AC7CFF] hover:bg-[#8A5CD6] text-black min-h-[44px]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {loading ? "Subiendo..." : "Confirmar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={loading}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-300 mb-1">Foto actual. Haz clic abajo para cambiarla.</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-800 hover:bg-gray-700 text-white min-h-[44px]"
                  >
                    Cambiar foto
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <ImageIcon className="w-10 h-10 text-gray-500 mb-3" />
            <p className="text-gray-400 mb-1">Arrastra tu imagen o haz clic para buscar</p>
            <p className="text-sm text-gray-400 mb-4">
              Imagen de cabecera del landing de la feria. Formatos: JPG, PNG, WEBP. Máx 5 MB.
            </p>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-800 hover:bg-gray-700 text-white min-h-[44px]"
            >
              Seleccionar Archivo
            </Button>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
      </div>
    </div>
  );
};
