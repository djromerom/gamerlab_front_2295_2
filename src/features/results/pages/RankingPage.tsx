"use client";

import NavBar from "@/components/NavBar";
import { useEffect, useState } from "react";
import { TextSizeControl } from "@/components/TextSizeControl";
import { DiscordButton } from "@/components/DiscordButton";
import { ArkadBackground } from "@/components/background/ArkadBackground";
import { PublicPodium } from "@/features/results/components/PublicPodium";
import { usePublicPodium } from "@/features/results/hooks/usePublicPodium";

const glowStyles = `
  @property --angle{
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes spin{
    from{
      --angle: 0deg;
    }
    to{
      --angle: 360deg;
    }
  }

  .gradient-border {
    position: relative;
    z-index: 0;
    border-radius: 8px;
    overflow: hidden;
  }

  .gradient-border::after, .gradient-border::before{
    content: '';
    position: absolute;
    height: 100%;
    width: 100%;
    background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    z-index: -1;
    border-radius: 8px;
    animation: 3s spin linear infinite;
  }
  
  .gradient-border::before{
    filter: blur(1.5rem);
    opacity: 0.5;
  }

  .gradient-border-inner {
    position: absolute;
    inset: 3px;
    background: #060312;
    border-radius: 6px;
    z-index: 1;
  }

  .gradient-border-gold::after, .gradient-border-gold::before {
    background-image: conic-gradient(
      from var(--angle),
      #FFD700,
      #FFC700,
      #FFB700,
      #FFA700,
      #FFD700
    );
  }

  .gradient-border-silver::after, .gradient-border-silver::before {
    background-image: conic-gradient(from var(--angle), #c0c0c0, #e8e8e8, #a9a9a9, #d3d3d3, #f5f5f5, #c0c0c0);
  }

  .gradient-border-bronze::after, .gradient-border-bronze::before {
    background-image: conic-gradient(from var(--angle), #cd7f32, #b87333, #a57164, #b87333, #cd7f32);
  }

  .gradient-border-purple::after, .gradient-border-purple::before {
    background-image: conic-gradient(
      from var(--angle),
      #6A0DAD,
      #8E2DE2,
      #A55EEA,
      #C084FC,
      #3C1361,
      #6A0DAD
    );
  }
`;

const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

/**
 * /ranking público (HU-48, ARK-307; back ARK-306): una pestaña por nivel que tenga podio y, en cada una,
 * solo el 1.º, 2.º y 3.º con logo, equipo y videojuego. Sin notas, sin lista debajo y sin la ponderación.
 * Depende de «Ranking público» en Configuración del evento.
 */
export default function RankingPage() {
  const { state, reload } = usePublicPodium();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = glowStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const levels = state.status === "ready" ? state.levels : [];
  // Empieza en el primer nivel disponible (CU-48, paso 2)
  const activeLevel = levels.find((level) => level.level === selectedLevel) ?? levels[0];

  return (
    <>
      <NavBar />

      <div className="relative min-h-screen overflow-hidden">
        <ArkadBackground modo="lento" estiloNuevo />

        {/* BG-66: en el celular deja espacio abajo para que los botones flotantes no tapen el podio */}
        <div className="relative z-10 flex flex-col items-center p-4 pb-40 sm:pb-12 pt-30 text-white">
          <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">
            <span className="text-[#AC7CFF]">Feria Gamer Uninorte</span>
            <span className="hidden md:inline"> - </span>
            <span className="block md:inline">Ranking de Videojuegos</span>
          </h1>

          {state.status === "loading" && <p className="text-center text-sm text-gray-300">Cargando ranking…</p>}

          {state.status === "error" && (
            <div role="alert" className="w-full max-w-xl rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center text-sm">
              <p>{state.message}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-3 rounded-md bg-[#AC7CFF] px-4 py-1.5 font-medium text-[#060312] cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {state.status === "hidden" && (
            <div className="w-full max-w-4xl mb-12">
              <div className="relative gradient-border gradient-border-purple p-0">
                <div className="gradient-border-inner"></div>
                <div className="relative z-10 text-center p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#AC7CFF]">
                    El ranking aún no está disponible debido a que la feria no ha
                    finalizado
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Los datos aparecerán una vez finalice el evento
                  </p>
                </div>
              </div>
            </div>
          )}

          {state.status === "ready" && levels.length === 0 && (
            <p className="text-center text-sm text-gray-300">Aún no hay equipos con nota.</p>
          )}

          {state.status === "ready" && activeLevel && (
            <>
              <div className="w-full max-w-6xl mb-8 px-4">
                <div
                  role="tablist"
                  aria-label="Niveles"
                  className="flex justify-start md:justify-center gap-2 md:gap-3 flex-nowrap md:flex-wrap overflow-x-auto [scrollbar-width:none] bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-2"
                >
                  {levels.map((level) => (
                    <button
                      key={level.level}
                      type="button"
                      role="tab"
                      aria-selected={level.level === activeLevel.level}
                      onClick={() => setSelectedLevel(level.level)}
                      className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base cursor-pointer rounded-md transition-all ${
                        level.level === activeLevel.level
                          ? "bg-[#AC7CFF] text-[#060312] font-medium"
                          : "text-gray-300 hover:bg-[#1A1428]"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <PublicPodium level={activeLevel} />
            </>
          )}

          <TextSizeControl />
          <DiscordButton discordUrl={discordSupportUrl} />
        </div>
      </div>
    </>
  );
}
