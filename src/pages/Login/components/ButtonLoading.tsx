import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  className: string;
}

export const ButtonLoading = ({ className }: Props) => {
  return (
    <Button className={className} disabled>
      <Loader2 className="animate-spin" />
      Please wait
    </Button>
  );
};
