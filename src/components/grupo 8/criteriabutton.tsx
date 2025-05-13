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
        <Button className="rounded-lg border border-[#B2B5FF] bg-transparent h-7 w-7 hover:bg-[#e5e7eb] dark:hover:bg-[#1C1930] transition-colors">
          <Menu  className="text-[#a0a3a9] dark:text-white "/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm text-muted-foreground">
        {description}
      </PopoverContent>
    </Popover>
  );
}


