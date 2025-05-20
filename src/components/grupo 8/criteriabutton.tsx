import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Menu } from "lucide-react";

interface CriteriabuttonProps {
  description: string;
}

export default function Criteriabutton({ description }: CriteriabuttonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="rounded-lg border bg-transparent h-7 w-7 hover:bg-sidebar transition-colors cursor-pointer">
          <Menu  className="text-foreground "/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm text-muted-foreground">
        {description}
      </PopoverContent>
    </Popover>
  );
}


