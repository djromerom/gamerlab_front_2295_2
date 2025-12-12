"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface CountdownTimerProps {
  targetDate: string | number | Date
  onCountdownEnd?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export default function CountdownTimer({ targetDate, onCountdownEnd }: CountdownTimerProps): React.ReactElement | null {
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
