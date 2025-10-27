"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { FaDiscord } from "react-icons/fa";

interface DiscordButtonProps {
  discordUrl: string
}

export function DiscordButton({ discordUrl }: DiscordButtonProps) {
  return (
    <div className="fixed right-2 bottom-20 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 cursor-pointer rounded-full bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] shadow-lg"
              onClick={() => window.open(discordUrl, "_blank")}
            >
                <FaDiscord className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Soporte Discord</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
