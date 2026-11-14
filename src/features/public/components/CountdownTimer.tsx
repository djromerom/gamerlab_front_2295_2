"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface CountdownTimerProps {
  targetDate: string | number | Date
  onCountdownEnd?: () => void
  /** "landing": versión compacta alineada a la izquierda del diseño de ARK-222 */
  variante?: "centrado" | "landing"
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export default function CountdownTimer({ targetDate, onCountdownEnd, variante = "centrado" }: CountdownTimerProps): React.ReactElement | null {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDate) - +new Date()

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
    }

    const totalSeconds = Math.floor(difference / 1000)

    const days = Math.floor(totalSeconds / (3600 * 24))
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return { days, hours, minutes, seconds, isExpired: false }
  }

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      // Call onCountdownEnd when countdown reaches 0
      if (newTimeLeft.isExpired && onCountdownEnd) {
        onCountdownEnd()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onCountdownEnd])

  // Don't render anything if countdown has expired
  if (timeLeft.isExpired) {
    return null
  }

  const { days, hours, minutes, seconds } = timeLeft

  const pad = (n: number): string => String(n).padStart(2, "0")
  const tiempo = days > 0 ? `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m` : `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`

  if (variante === "landing") {
    return (
      <div className="flex flex-col gap-1" role="timer" aria-label={`La competencia inicia en ${tiempo}`}>
        <p className="text-sm text-[#C9D6FF]">La competencia inicia en</p>
        <p className="font-unbounded text-2xl font-bold tabular-nums text-white md:text-3xl">{tiempo}</p>
      </div>
    )
  }

  return (
    <div className="text-center mb-8 sm:mt-8">
      <p className="text-white/80 mb-2">La competencia inicia en</p>
      <div className="text-4xl sm:text-6xl font-bold">
        {days > 0 ? (
          <span>
            {pad(days)}d : {pad(hours)}h : {pad(minutes)}m
          </span>
        ) : (
          <span>
            {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s
          </span>
        )}
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full max-w-3xl mx-auto"></div>
    </div>
  )
}
