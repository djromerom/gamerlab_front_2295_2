"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Sparkles, GamepadIcon, Trophy, Star } from "lucide-react"

interface EventStartedAnnouncementProps {
  showConfetti?: boolean
  confettiFadingOut?: boolean
  eventEnded?: boolean
}

const FairStartedAnnouncement: React.FC<EventStartedAnnouncementProps> = ({
  showConfetti = true,
  confettiFadingOut = false,
  eventEnded = false,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{
      id: number
      left: string
      delay: string
      color: string
    }>
  >([])

  useEffect(() => {
    setIsVisible(true)

    // Generate confetti pieces only once when component mounts
    if (showConfetti && confettiPieces.length === 0) {
      const pieces = [...Array(40)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        color: eventEnded
          ? ["#4ade80", "#34d399", "#2dd4bf", "#22d3ee", "#38bdf8"][Math.floor(Math.random() * 5)] // Green/blue for event ended
          : ["#FF3E7F", "#7E52A0", "#FE9900", "#00D1FF", "#E73587"][Math.floor(Math.random() * 5)], // Original colors
      }))
      setConfettiPieces(pieces)
    }
  }, [showConfetti, confettiPieces.length, eventEnded])

  if (!showConfetti) {
    return (
      <div className="text-center mb-8 sm:mt-8 transition-all duration-1000 opacity-100 scale-100">
        <div className="relative">
          <div
            className={`${
              eventEnded
                ? "bg-gradient-to-r from-green-00 via-cyan-600 to-teal-00"
                : "bg-gradient-to-r from-purple-00 via-violet-600 to-indigo-00"
            } rounded-xl p-3 sm:p-6 shadow-[0_0_30px_rgba(139,92,246,0.5)] border ${
              eventEnded ? "border-green-400/30" : "border-purple-400/30"
            } max-w-4xl mx-auto`}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center justify-center bg-white/10 rounded-full p-2 sm:p-3">
                {eventEnded ? (
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
                ) : (
                  <GamepadIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
                )}
              </div>

              <div className="text-center md:text-left">
                <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white flex items-center justify-center  gap-1 sm:gap-2">
                  <Sparkles
                    className={`inline-block w-5 h-5 sm:w-6 sm:h-6 ${eventEnded ? "text-green-300" : "text-yellow-300"}`}
                  />
                  {eventEnded ? "¡La Feria Gamer fue un éxito!" : "¡La Feria Gamer ha comenzado!"}
                  <Sparkles
                    className={`inline-block w-5 h-5 sm:w-6 sm:h-6 ${eventEnded ? "text-green-300" : "text-yellow-300"}`}
                  />
                </h3>
                <p className="text-sm sm:text-base text-white/90 mt-1 sm:mt-2">
                  {eventEnded
                    ? "Gracias a todos los participantes por hacer de esta feria una experiencia inolvidable"
                    : "Explora los increíbles proyectos y sumérgete en la experiencia gaming definitiva"}
                </p>
              </div>

              <div className="hidden md:flex items-center justify-center bg-white/10 rounded-full p-3">
                <Trophy size={32} className={eventEnded ? "text-green-300" : "text-yellow-300"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`text-center mb-8 sm:mt-8 transition-all duration-1000 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
    >
      <div
        className={`absolute -top-30 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-54 md:h-59 pointer-events-none overflow-hidden`}
      >
        <div className={`confetti-container ${confettiFadingOut ? "fade-out" : ""}`}>
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className={`confetti ${confettiFadingOut ? "fade-out" : ""}`}
              style={{
                left: piece.left,
                animationDelay: confettiFadingOut ? "0s" : piece.delay, // Remove delay during fade-out
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          className={`${
            eventEnded
              ? "bg-gradient-to-r from-green-00 via-cyan-600 to-teal-00"
              : "bg-gradient-to-r from-purple-00 via-violet-600 to-indigo-00"
          } rounded-xl p-3 sm:p-6 shadow-[0_0_30px_rgba(139,92,246,0.5)] border ${
            eventEnded ? "border-green-400/30" : "border-purple-400/30"
          } max-w-4xl mx-auto`}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center justify-center bg-white/10 rounded-full p-2 sm:p-3">
              {eventEnded ? (
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
              ) : (
                <GamepadIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
              )}
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-1 sm:gap-2">
                <Sparkles
                  className={`inline-block w-5 h-5 sm:w-6 sm:h-6 ${eventEnded ? "text-green-300" : "text-yellow-300"}`}
                />
                {eventEnded ? "¡La Feria Gamer fue un éxito!" : "¡La Feria Gamer ha comenzado!"}
                <Sparkles
                  className={`inline-block w-5 h-5 sm:w-6 sm:h-6 ${eventEnded ? "text-green-300" : "text-yellow-300"}`}
                />
              </h3>
              <p className="text-sm sm:text-base text-white/90 mt-1 sm:mt-2">
                {eventEnded
                  ? "Gracias a todos los participantes por hacer de esta feria una experiencia inolvidable"
                  : "Explora los increíbles proyectos y sumérgete en la experiencia gaming definitiva"}
              </p>
            </div>

            <div className="hidden md:flex items-center justify-center bg-white/10 rounded-full p-3">
              <Trophy size={32} className={eventEnded ? "text-green-300" : "text-yellow-300"} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default FairStartedAnnouncement





