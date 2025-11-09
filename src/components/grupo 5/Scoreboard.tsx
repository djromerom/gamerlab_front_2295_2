"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import Review from "@/components/grupo 5/Review"

export default function Scoreboard() {
  const [rawRatings, setRawRatings] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { 
    const fetchRawRatings = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })

        if (!res.ok) {
          alert("Error fetching ratings")
          setRawRatings([])
          setLoading(false)
          return
        }
        const data = await res.json()

        if (!data || !data.data || !Array.isArray(data.data)) {
          setRawRatings([])
          setLoading(false)
          return
        }

        const raw: number[] = data.data.map((item: { evaluationScore: number }) => 
          typeof item.evaluationScore === 'number' ? item.evaluationScore : 0
        );

        setRawRatings(raw)
      } catch (error) {
        console.error("Error fetching ratings:", error)
        setRawRatings([])
      } finally {
        setLoading(false)
      }

      
    }

    fetchRawRatings()
  }, [])

  const totalRatings = rawRatings.length
  // Fixed NaN issue: ensure we always have valid numbers

  const averageRatingValue =
    totalRatings === 0
      ? 0
      : rawRatings.reduce(
          (sum, r) => sum + (Number.isFinite(r) ? r : 0),
          0
        ) / totalRatings


  const averageRating = averageRatingValue.toFixed(2)
  let averagePercent = Math.min(
    100,
    Math.max(0, (averageRatingValue / 5) * 100)
  )
  const progressPercent = Number.isFinite(averagePercent) ? averagePercent : 0

  const renderStars = (rating: number) => {
    const starSize = "w-10 h-20"
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className={`${starSize} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className={`${starSize} text-yellow-400`} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#halfGradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className={`${starSize} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    return stars
  }
  // Update progress bar width when progressPercent changes
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progressPercent.toFixed(0)}%`
    }
  }, [progressPercent])

  if (loading) {
    return <LoadingScreen text="Cargando información de calificaciones..." />
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4">
      <Card className="w-full shadow-sm border">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg font-medium text-foreground">Retroalimentación del VideoJuego</CardTitle>
          <CardDescription className="text-sm text-foreground/50">
            Las entregas son evaluadas según las especificaciones del proyecto. Revisa la retroalimentación de tus tareas a continuación.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-70 h-70">
              <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="8"
                  strokeDasharray="289.026"
                  strokeDashoffset={289.026 - (289.026 * (isNaN(Number.parseFloat(averageRating)) ? 0 : Number.parseFloat(averageRating))) / 5}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              
              
              <div className="absolute inset-0 flex flex-col items-center ">
                <span className="text-7xl font-bold pt-[3.3rem]">{averageRating}</span>
                <div className="flex mt-0">{renderStars(isNaN(Number.parseFloat(averageRating)) ? 0 : Number.parseFloat(averageRating))}</div>
                <span className="text-md text-foreground mt-1 pt-[0.2rem]">de 5.0</span>
              </div>
            </div>

            <div className="text-lg font-semibold text-foreground mt-2 flex items-center">
              <span>Basado en {totalRatings} calificaciones</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1" title="¿Cómo calculamos el promedio?" aria-label="¿Cómo calculamos el promedio?">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Promedio ponderado de todas las calificaciones</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-24 text-sm text-right">Progreso</div>
              <div className="flex-1 relative h-2 bg-gray-400 rounded-full overflow-hidden">
                <div
                  ref={progressBarRef}
                  className="absolute inset-y-0 left-0 rounded-full bg-yellow-400 transition-all duration-500"
                />
              </div>
              <div className="w-14 text-sm text-foreground/70 text-right">
                <span>{progressPercent.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Review />
    </div>
  )
}