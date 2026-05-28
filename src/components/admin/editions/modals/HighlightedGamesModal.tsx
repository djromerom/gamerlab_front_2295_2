import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HighlightedGamesSelector } from "@/components/admin/editions/HighlightedGamesSelector";
import { Gamepad2 } from "lucide-react";

interface HighlightedGamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
}

export const HighlightedGamesModal: React.FC<HighlightedGamesModalProps> = ({
  open,
  onOpenChange,
  editionId,
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
          <HighlightedGamesSelector editionId={editionId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
