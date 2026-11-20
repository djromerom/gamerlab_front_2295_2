import type { PodiumLevel } from "@/features/results/lib/publicPodium";
import { podiumLogo, podiumTeamName } from "@/features/results/lib/publicPodium";

// Podio de un nivel: 2.º, 1.º y 3.º, en ese orden de izquierda a derecha.
const PODIUM_SPOTS = [
  { place: 2, avatar: "h-20 w-20", ring: "border-[#c0c0c0]", initial: "text-2xl", name: "text-lg", bar: "h-32 gradient-border-silver", number: "text-6xl" },
  { place: 1, avatar: "h-24 w-24", ring: "border-[#FFD700]", initial: "text-3xl", name: "text-xl", bar: "h-40 gradient-border-gold", number: "text-7xl" },
  { place: 3, avatar: "h-16 w-16", ring: "border-[#CD7F32]", initial: "text-xl", name: "text-base", bar: "h-24 gradient-border-bronze", number: "text-5xl" },
] as const;

const PLACE_NAMES = { 1: "Primer puesto", 2: "Segundo puesto", 3: "Tercer puesto" } as const;

/** Podio público de un nivel (HU-48): logo, equipo y videojuego de los 3 primeros, sin notas. */
export function PublicPodium({ level }: { level: PodiumLevel }) {
  return (
    <div className="flex w-full max-w-4xl items-end justify-center gap-3 sm:gap-8" role="list" aria-label={`Podio ${level.label}`}>
      {PODIUM_SPOTS.map((spot) => {
        const team = level.places[spot.place - 1];
        // Hueco vacío: el 1.º conserva su ancho aunque falten el 2.º o el 3.º (CU-48 A1).
        if (!team) return <div key={spot.place} aria-hidden="true" className="w-full" />;
        const name = podiumTeamName(team);
        const logo = podiumLogo(team);
        return (
          <div
            key={spot.place}
            role="listitem"
            aria-label={`${PLACE_NAMES[spot.place]}: ${name}`}
            data-podium-place={spot.place}
            className="flex w-full min-w-0 flex-col items-center"
          >
            <div className="mb-4 flex w-full flex-col items-center">
              <div className={`relative mb-2 ${spot.avatar} overflow-hidden rounded-full border-4 ${spot.ring} bg-gray-800 flex items-center justify-center`}>
                {logo ? (
                  <img src={logo} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span className={`${spot.initial} font-bold text-white`}>{name.substring(0, 1)}</span>
                )}
              </div>
              <p className={`w-full text-center ${spot.name} font-semibold [overflow-wrap:anywhere]`}>{name}</p>
              {team.videogameName && (
                <p className="w-full text-center text-sm text-gray-300 [overflow-wrap:anywhere]">{team.videogameName}</p>
              )}
            </div>

            <div className={`${spot.bar} w-full rounded-t-lg shadow-lg relative gradient-border`}>
              <div className="gradient-border-inner"></div>
              <div className="flex h-full items-center justify-center relative z-10">
                <span className={`${spot.number} font-bold text-white`}>{spot.place}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
