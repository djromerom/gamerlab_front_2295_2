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

function Landing(): React.ReactElement {
  const [eventStarted, setEventStarted] = useState<boolean>(false)
  const [eventEnded, setEventEnded] = useState<boolean>(false)
  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  const [confettiFadingOut, setConfettiFadingOut] = useState<boolean>(false)

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast")
    document.documentElement.classList.add("dark")

    // Check event status when component mounts
    const startDate = new Date("2025-06-05T08:30:00")
    const endDate = new Date("2025-06-05T12:30:00") 
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

  const targetDate = new Date("2025-06-05T08:30:00")
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
    return "Conoce más"
  }

  const getButtonRoute = () => {
    if (eventEnded) return "/ranking"
    return "/informacion"
  }

  const getDescriptionText = () => {
    if (eventEnded) {
      return "Revive los mejores momentos de la feria y explora todos los increíbles proyectos que fueron presentados por nuestros talentosos estudiantes."
    }
    if (eventStarted) {
      return "La experiencia definitiva donde la creatividad y la tecnología se encuentran ya está aquí. Explora los videojuegos más innovadores creados por talentosos estudiantes."
    }
    return "Bienvenidos a la experiencia definitiva donde la creatividad y la tecnología se encuentran. Únete a nosotros para explorar los videojuegos más innovadores creados por talentosos estudiantes."
  }

  return (
    <>
      <NavBar />
      <div className="relative h-dvh bg-[#0d0f14] overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
          style={{ backgroundImage: "url('/background.webp')" }}
        >
          <div className="absolute inset-0"></div>
        </div>

        <div className="relative z-10 text-white text-center sm:pt-11 px-4 flex flex-col justify-center items-center min-h-screen">
          {eventStarted ? (
            <FairStartedAnnouncement
              showConfetti={showConfetti}
              confettiFadingOut={confettiFadingOut}
              eventEnded={eventEnded}
            />
          ) : (
            <CountdownTimer targetDate={targetDate} onCountdownEnd={handleCountdownEnd} />
          )}

          <h1 className="font-inter text-4xl sm:text-5xl xl:text-7xl font-bold">
            Una muestra de videojuegos sin precedentes en Uninorte
          </h1>
          <h2 className="text-2xl md:text-4xl font-medium tracking-tighter mt-4">Feria Gamer Uninorte</h2>
          <p className="text-lg md:text-xl mt-6 max-w-3xl">{getDescriptionText()}</p>
          <div className="mt-8">
            <button
              onClick={() => navigate(getButtonRoute())}
              className="bg-white text-[#060312] py-3 px-3 rounded-lg font-medium hover:bg-gray-100 hover:shadow-[0px_0px_12px_#8c45ff] hover:scale-103 transform transition-all duration-300 cursor-pointer"
            >
              {getButtonText()}
            </button>
          </div>
          <TextSizeControls />
          <DiscordButton discordUrl={discordSupportUrl} />
        </div>
      </div>
    </>
  )
}

export default Landing


