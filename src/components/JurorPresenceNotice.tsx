import { Clock } from "lucide-react";
import { useJurorPresence } from "@/features/jurors/presence/contexts/JurorPresenceContext";
import { formatBogotaTime, presenceHelp } from "@/features/jurors/presence/api/jurorPresence";
import { isPastInstant } from "@/lib/bogotaDateTime";

/**
 * Ayuda en las pantallas del jurado (HU-23): mientras califica, debe mantener la plataforma
 * abierta para ver la pregunta. Solo aparece si ya llegó y las evaluaciones están abiertas.
 */
export function JurorPresenceNotice({ className = "" }: { className?: string }) {
  const { presence } = useJurorPresence();
  if (!presence?.checkedIn || !presence.evaluationsOpen) return null;

  return (
    <div role="note" className={`flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm ${className}`}>
      <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p>
        {presenceHelp(presence.settings)}
        {presence.nextPromptAt && !presence.promptDue && !isPastInstant(presence.nextPromptAt, presence.serverTime) && (
          <span className="text-muted-foreground"> Próxima pregunta hacia las {formatBogotaTime(presence.nextPromptAt)}.</span>
        )}
      </p>
    </div>
  );
}
