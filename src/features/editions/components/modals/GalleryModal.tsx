import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GalleryUpload } from "@/features/editions/components/GalleryUpload";
import { Images } from "lucide-react";

interface GalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
  existingPhotos?: { id: string; url: string }[];
  onSuccess?: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  open,
  onOpenChange,
  editionId,
  existingPhotos = [],
  onSuccess,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Images className="w-5 h-5 text-[#AC7CFF]" />
            Galería de Fotos
          </DialogTitle>
          <DialogDescription>
            Máx 5 MB por imagen · JPG · PNG · WEBP · Límite 50 fotos por edición
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <GalleryUpload
            editionId={editionId}
            existingPhotos={existingPhotos}
            onSuccess={onSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
