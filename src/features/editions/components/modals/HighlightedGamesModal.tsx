import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HighlightedGamesSelector } from "@/features/editions/components/HighlightedGamesSelector";
import { Gamepad2 } from "lucide-react";
import type { EditionStatus } from "@/api/editions";

interface HighlightedGamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
  /** Estado de la edición: si está archivada, el selector lista sus juegos históricos */
  editionStatus?: EditionStatus;
}

export const HighlightedGamesModal: React.FC<HighlightedGamesModalProps> = ({
  open,
  onOpenChange,
  editionId,
  editionStatus,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gamepad2 className="w-5 h-5 text-[#AC7CFF]" />
            Juegos Destacados
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <HighlightedGamesSelector editionId={editionId} editionStatus={editionStatus} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
