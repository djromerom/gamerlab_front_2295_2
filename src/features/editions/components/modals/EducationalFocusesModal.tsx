import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EducationalFocusesManager } from "@/features/editions/components/EducationalFocusesManager";
import { GraduationCap } from "lucide-react";

interface EducationalFocusesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
}

export const EducationalFocusesModal: React.FC<EducationalFocusesModalProps> = ({
  open,
  onOpenChange,
  editionId,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="w-5 h-5 text-[#AC7CFF]" />
            Enfoques Educativos
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <EducationalFocusesManager editionId={editionId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
