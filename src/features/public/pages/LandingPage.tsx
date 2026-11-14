"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import "@/index.css"
import CountdownTimer from "@/features/public/components/CountdownTimer"
import LandingHeader from "@/features/public/components/LandingHeader"
import { FondoArkad } from "@/components/fondo/FondoArkad"
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl"
import { DiscordButton } from "@/components/grupo 5/DiscordButton"

// Inicio de la feria: hasta esa hora la landing muestra la cuenta regresiva
const INICIO_FERIA = new Date("2026-05-28T08:00:00")
const DISCORD_SOPORTE = "https://discord.gg/RzAvUdspaT"

/** Landing pública con el diseño aprobado en ARK-222 (mockups/feria-gamer-vistas.html). */
function LandingPage(): React.ReactElement {
  const navigate = useNavigate()
  const [feriaIniciada, setFeriaIniciada] = useState<boolean>(() => new Date() >= INICIO_FERIA)

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast")
    document.documentElement.classList.add("dark")
    return () => {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden font-inter text-[#F4F7FF]">
      {/* Escena animada con el logo de Arkad, centrada a la derecha del texto */}
      <FondoArkad modo="vivo" centro={[0.7, 0.5]} opacidadLogo={1} />
      {/* Velo para que el texto se lea sobre la escena */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] max-md:bg-[rgba(5,10,36,0.62)] md:bg-[linear-gradient(90deg,rgba(5,10,36,0.9)_0%,rgba(5,10,36,0.55)_40%,rgba(5,10,36,0)_66%)]"
      />

      <LandingHeader />

      <main className="relative z-10 flex flex-1 flex-col justify-center px-5 pt-9 pb-14 md:px-[clamp(20px,5vw,72px)] md:pt-[clamp(36px,5vw,64px)] md:pb-[clamp(56px,6vw,72px)]">
        <div className="flex max-w-[700px] flex-col items-start gap-[22px]">
          {!feriaIniciada && (
            <CountdownTimer targetDate={INICIO_FERIA} onCountdownEnd={() => setFeriaIniciada(true)} variante="landing" />
          )}

          <p className="m-0 inline-flex items-center gap-3 text-[13px] font-semibold tracking-[0.2em] text-[#C9D6FF] before:h-px before:w-9 before:shrink-0 before:bg-[#A9C4FF] before:content-['']">
            VI EDICIÓN · UNIVERSIDAD DEL NORTE
          </p>
          <h1 className="m-0 font-unbounded text-[clamp(44px,7vw,104px)] leading-[0.98] font-extrabold tracking-[-0.02em] text-white [text-shadow:0_0_34px_rgba(110,145,255,0.55)]">
            FERIA
            <br />
            GAMER
          </h1>
          <p className="m-0 font-unbounded text-[clamp(13px,1.25vw,17px)] font-medium tracking-[0.12em] text-[#A9C4FF]">
            USO SALUDABLE DE LAS REDES SOCIALES
          </p>
          <p className="m-0 max-w-[540px] text-[clamp(16px,1.25vw,18px)] leading-[1.65] text-[#D5DDFA]">
            La exhibición de los mejores videojuegos creados por estudiantes. Inscribe a tu equipo, presenta tu proyecto ante el
            jurado y compite por el podio.
          </p>

          <div className="mt-2 flex w-full flex-wrap gap-3.5 md:w-auto">
            {/* Siempre visible: si las inscripciones están cerradas, /registro-equipo muestra "Inscripciones cerradas" */}
            <button
              type="button"
              onClick={() => navigate("/registro-equipo")}
              className="inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-white px-7 text-base font-bold text-[#0B1A6B] shadow-[0_10px_34px_rgba(76,116,255,0.55)] transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(76,116,255,0.8)] md:w-auto"
            >
              Inscribir equipo
              <ArrowRight className="size-[18px]" aria-hidden />
            </button>
            <Link
              to="/equipos"
              className="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl border border-[rgba(201,214,255,0.5)] bg-[rgba(169,196,255,0.08)] px-7 text-base font-semibold text-white transition-[translate,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[rgba(169,196,255,0.18)] md:w-auto"
            >
              Ver videojuegos
            </Link>
          </div>
        </div>
      </main>
      <TextSizeControls />
      <DiscordButton discordUrl={DISCORD_SOPORTE} />
    </div>
  )
}

export default LandingPage
