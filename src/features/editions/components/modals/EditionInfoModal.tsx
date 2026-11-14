import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditionForm } from "@/features/editions/components/EditionForm";
import { FileText } from "lucide-react";
import { type Edition } from "@/fetchs/editions";

interface EditionInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edition: Edition;
  onSuccess?: () => void;
}

export const EditionInfoModal: React.FC<EditionInfoModalProps> = ({
  open,
  onOpenChange,
  edition,
  onSuccess,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-[#AC7CFF]" />
            Información General
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <EditionForm
            editionId={edition.id}
            initialData={edition}
            onSuccess={() => {
              onOpenChange(false);
              if (onSuccess) onSuccess();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
