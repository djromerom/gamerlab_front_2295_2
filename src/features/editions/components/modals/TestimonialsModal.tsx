import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TestimonialsManager } from "@/features/editions/components/TestimonialsManager";
import { MessageSquareQuote } from "lucide-react";

interface TestimonialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editionId: number;
}

export const TestimonialsModal: React.FC<TestimonialsModalProps> = ({
  open,
  onOpenChange,
  editionId,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquareQuote className="w-5 h-5 text-[#AC7CFF]" />
            Testimonios
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <TestimonialsManager editionId={editionId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
