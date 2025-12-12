"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Type, PlusIcon as TypePlus, MinusIcon as TypeMinus } from "lucide-react"
import { useTextSize } from "@/contexts/TextSizeContext"

export function TextSizeControls() {
  const { increaseFontSize, decreaseFontSize } = useTextSize()

  return (
    <div className="fixed right-2 bottom-5 z-50">
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="h-10 w-10 cursor-pointer rounded-full bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] shadow-lg"
                >
                  <Type className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent side="left" className="w-auto p-0">
          <div className="flex flex-col gap-2 p-2">
            <Button
              variant="default"
              className="flex cursor-pointer items-center justify-start gap-2 bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)]"
              onClick={increaseFontSize}
            >
              <TypePlus className="h-4 w-4" />
              <span>Aumentar letra</span>
            </Button>

            <Button variant="outline" className="flex cursor-pointer items-center justify-start gap-2" onClick={decreaseFontSize}>
              <TypeMinus className="h-4 w-4" />
              <span>Reducir letra</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
