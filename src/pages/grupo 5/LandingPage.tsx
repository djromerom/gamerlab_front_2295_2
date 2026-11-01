"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import "@/index.css"
import "@/styles/confetti.css"
import CountdownTimer from "@/components/grupo 5/CountdownTimer"
import FairStartedAnnouncement from "@/components/grupo 5/FairStartedAnnouncement"
import NavBar from "@/components/grupo 5/NavBar"
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl"
import { DiscordButton } from "@/components/grupo 5/DiscordButton"
import { fetchRegistrationsOpen } from "@/fetchs/registrations"

function Landing(): React.ReactElement {
  const [eventStarted, setEventStarted] = useState<boolean>(false)
  const [eventEnded, setEventEnded] = useState<boolean>(false)
  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  const [confettiFadingOut, setConfettiFadingOut] = useState<boolean>(false)
  const startDate = new Date("2026-05-28T08:00:00")
  const endDate = new Date("2026-05-28T12:00:00")

  // temporary workaround to disable inscriptions (2026-1). It should become an admin setting
  // To restore registrations, also uncomment route in RoutesConfiguration.tsx
  const showRegisterButton = false;

  // Con las inscripciones abiertas (ajuste del admin) el inicio lleva al formulario
  const [registrationsOpen, setRegistrationsOpen] = useState<boolean>(false)
  useEffect(() => {
    let active = true
    fetchRegistrationsOpen().then((open) => {
      if (active) setRegistrationsOpen(open)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast")
    document.documentElement.classList.add("dark")

    // Check event status when component mounts
    const now = new Date()

    if (now >= endDate) {
      // Event has ended
      setEventEnded(true)
      setEventStarted(true)
      // Show confetti for event end
      setShowConfetti(true)
      // Start fade-out animation after 4 seconds
      setTimeout(() => {
        setConfettiFadingOut(true)
      }, 8000)
      // Completely hide confetti after fade-out animation completes
      setTimeout(() => {
        setShowConfetti(false)
        setConfettiFadingOut(false)
      }, 10000)
    } else if (now >= startDate) {
      // Event has started but not ended
      setEventStarted(true)
      setEventEnded(false)
      // Show confetti for event start
      setShowConfetti(true)
      // Start fade-out animation after 4 seconds
      setTimeout(() => {
        setConfettiFadingOut(true)
      }, 8000)
      // Completely hide confetti after fade-out animation completes
      setTimeout(() => {
        setShowConfetti(false)
        setConfettiFadingOut(false)
      }, 10000)
    } else {
      // Event hasn't started yet
      setEventStarted(false)
      setEventEnded(false)
    }

    return () => {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const navigate = useNavigate()
  const discordSupportUrl = "https://discord.gg/RzAvUdspaT"

  const handleCountdownEnd = () => {
    setEventStarted(true)
    setEventEnded(false)
    setShowConfetti(true)

    // Start fade-out animation after 4 seconds
    setTimeout(() => {
      setConfettiFadingOut(true)
    }, 8000)

    // Completely hide confetti after fade-out animation completes
    setTimeout(() => {
      setShowConfetti(false)
      setConfettiFadingOut(false)
    }, 10000) // 4 seconds + 2.5 seconds for fade-out
  }

  const getButtonText = () => {
    if (eventEnded) return "Ver ranking"
    if (eventStarted) return "Ver videojuegos"
    return "Registrar equipo"
  }

  const getButtonRoute = () => {
    if (eventEnded) return "/ranking"
    if (eventStarted) return "/equipos"
    return "/registro-equipo"
  }

  const getDescriptionText = () => {
    if (eventEnded) {
      return "Revive los mejores momentos de la feria y explora todos los increíbles proyectos que fueron presentados por nuestros talentosos estudiantes."
    }
    if (eventStarted) {
      return "La experiencia definitiva donde la creatividad y la tecnología se encuentran ya está aquí. Explora los videojuegos más innovadores creados por talentosos estudiantes."
    }
    return "Bienvenidos a la experiencia definitiva donde la creatividad y la tecnología se encuentran. Inscríbete y explora los videojuegos creados por nuestros estudiantes."
  }

  return (
    <>
      <NavBar />
      <div className="relative min-h-dvh bg-[#0d0f14] overflow-x-hidden">
        {/* Contenedor del fondo animado para evitar que su movimiento cause scroll */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div
            className="absolute -inset-12 bg-cover bg-center bg-no-repeat animate-float"
            style={{ backgroundImage: "url('/background.webp')" }}
          >
            <div className="absolute inset-0"></div>
          </div>
        </div>

        <div className="relative z-10 text-white text-center px-4 flex flex-col items-center min-h-dvh">
          <div className="my-auto flex flex-col items-center justify-center w-full pt-16 pb-24 md:py-16">
            {eventStarted ? (
              <FairStartedAnnouncement
                showConfetti={showConfetti}
                confettiFadingOut={confettiFadingOut}
                eventEnded={eventEnded}
              />
            ) : (
              <CountdownTimer targetDate={startDate} onCountdownEnd={handleCountdownEnd} />
            )}

            <h1 className="md:px-24 font-inter text-3xl md:text-4xl sm:text-5xl xl:text-7xl max-h-[500px]:!text-3xl font-bold">
              Una exhibición de los mejores videojuegos estudiantiles
            </h1>
            <h2 className="text-xl md:text-4xl font-medium tracking-tighter mt-4 max-h-[500px]:!text-xl">Feria Gamer Uninorte</h2>
            <p className="text-md md:text-2xl mt-6 max-w-4xl max-h-[500px]:!text-base">{getDescriptionText()}</p>
            <div className="mt-8">
              {registrationsOpen && (
                <button
                  onClick={() => navigate("/registro-equipo")}
                  className="bg-white text-[#060312] py-3 px-3 rounded-lg font-medium hover:bg-gray-100 hover:shadow-[0px_0px_12px_#8c45ff] hover:scale-103 transform transition-all duration-300 cursor-pointer"
                >
                  Inscribe tu equipo
                </button>
              )}
              
              {/* See registro-equipo in RoutesConfiguration for an explanation c:
              showRegisterButton && (
                <button
                  onClick={() => navigate(getButtonRoute())}
                  className="bg-white text-[#060312] py-3 px-3 rounded-lg font-medium hover:bg-gray-100 hover:shadow-[0px_0px_12px_#8c45ff] hover:scale-103 transform transition-all duration-300 cursor-pointer"
                >
                  {getButtonText()}
                </button>
              )*/}
            </div>
          </div>
          <TextSizeControls />
          <DiscordButton discordUrl={discordSupportUrl} />
        </div>
      </div>
    </>
  )
}

export default Landing


