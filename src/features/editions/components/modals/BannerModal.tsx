import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BannerUpload } from "@/features/editions/components/BannerUpload";
import { ImageIcon } from "lucide-react";

interface BannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
  currentPhotoUrl?: string;
  onSuccess?: () => void;
}

export const BannerModal: React.FC<BannerModalProps> = ({
  open,
  onOpenChange,
  editionId,
  currentPhotoUrl,
  onSuccess,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="w-5 h-5 text-[#AC7CFF]" />
            Foto Principal
          </DialogTitle>
          <DialogDescription>
            Esta foto aparecerá en la cabecera del landing de la feria.
            <br />
            Máx 5 MB — Formatos: JPG · PNG · WEBP.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <BannerUpload
            editionId={editionId}
            currentPhotoUrl={currentPhotoUrl}
            onSuccess={onSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
