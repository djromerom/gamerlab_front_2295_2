"use client"



import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import Review from "@/components/grupo 5/Review"

import TeamCode from "@/components/grupo 5/TeamCode.tsx"
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"


export default function Scoreboard() {
  const [rawRatingsAll, setRawRatingsAll] = useState<number[]>([])
  // obtain permission for viewing student grades.
  const ratingsACRef = useRef<AbortController | null>(null)
  const { canViewScores } = useGlobalState()

  const [loading, setLoading] = useState(true)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  // Obtain permission for viewing student grades from backend and poll for changes.
  const fetchRatings = useCallback(async () => {
    // si está deshabilitado, limpiar y salir
    if (!canViewScores) {
      ratingsACRef.current?.abort()
      setRawRatingsAll([])
      setLoading(false)
      return
    }

    // cancelar llamada previa y crear nueva
    ratingsACRef.current?.abort()
    ratingsACRef.current = new AbortController()
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: ratingsACRef.current.signal,
      })

      if (!res.ok) {
        console.warn("Error fetching ratings:", res.status)
        setRawRatingsAll([])
        return
      }

      const data = await res.json()
      if (!data || !Array.isArray(data.data)) {
        setRawRatingsAll([])
        return
      }

      const raw: number[] = data.data.map((item: any) =>
        typeof item.evaluationScore === "number" ? item.evaluationScore : 0
      )
      setRawRatingsAll(raw)
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("fetchRatings error:", err)
        setRawRatingsAll([])
      }
    } finally {
      setLoading(false)
    }
  }, [canViewScores])

  // Ejecutar fetchRatings cuando cambie canViewScores
  useEffect(() => {
    fetchRatings()
    return () => {
      ratingsACRef.current?.abort()
    }
  }, [canViewScores, fetchRatings])
  

 

  const totalRatings = rawRatingsAll.length
  // Fixed NaN issue: ensure we always have valid numbers

  const averageRatingValue =
    totalRatings === 0
      ? 0
      : rawRatingsAll.reduce(
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
    const starSize = "w-5 h-8 sm:w-6 sm:h-10 md:w-7 md:h-12"
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
              <stop offset="100%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#D1D5DB" />
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

  // Loading / permission states
  if (canViewScores === null) {
    return <LoadingScreen text="Verificando permisos para ver calificaciones..." />
  }
  

  // Permission denied
  if (canViewScores === false) {
    return (
      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full sm:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <TeamCode variant="default" />
        <Card className="w-full shadow-sm border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-lg sm:text-xl font-medium text-foreground">Calificaciones no disponibles</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-foreground/50">
              <p className="text-sm text-foreground/70">No te preocupes, en cuanto estén listas para ser reveladas, aparecerán aquí.... <strong>¡el suspenso es parte del aprendizaje!✨</strong></p>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-foreground/70">Cuando el administrador habilite la publicación, aquí estará disponible tu calificación.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <LoadingScreen text="Cargando información de calificaciones..." />
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full sm:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        {/* Team code */}
        <TeamCode variant="default" />
        {/* finished teamCode */}
      <Card className="w-full shadow-sm border min-w-[350px] ">
        <CardHeader className="p-4 sm:p-6 pb-2">
          
          <CardTitle className="text-lg sm:text-xl font-medium text-foreground">Retroalimentación del VideoJuego</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-foreground/50">
            Las entregas son evaluadas según las especificaciones del proyecto. Revisa la retroalimentación de tus tareas a continuación.
          </CardDescription>
        </CardHeader>
        {/* circulo de calificacion */}
        <CardContent className="p-3 sm:p-6 pt-2 space-y-3 sm:space-y-4">
          <div className="flex flex-col items-center mb-6 sm:mb-10">
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60">
              <div className="absolute inset-0 rounded-full border-6 sm:border-8 border-gray-100"></div>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="6"
                  strokeDasharray="289.026"
                  strokeDashoffset={289.026 - (289.026 * (isNaN(Number.parseFloat(averageRating)) ? 0 : Number.parseFloat(averageRating))) / 5}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              {/* tamaño de estrella */}
              <div className="absolute inset-0 flex flex-col items-center">
                <span className="text-4xl sm:text-5xl md:text-6xl font-bold pt-8 sm:pt-10 md:pt-10">{averageRating}</span>
                <div className="flex mt-1 sm:mt-2">{renderStars(isNaN(Number.parseFloat(averageRating)) ? 0 : Number.parseFloat(averageRating))}</div>
                <span className="text-xs sm:text-sm md:text-base text-foreground mt-1">de 5.0</span>
              </div>
            </div>

            <div className="text-sm sm:text-base md:text-lg font-semibold text-foreground mt-3 sm:mt-4 flex items-center flex-wrap justify-center gap-1">
              <span>Basado en {totalRatings} calificaciones</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1" title="¿Cómo calculamos el promedio?" aria-label="¿Cómo calculamos el promedio?">
                      <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Promedio ponderado de todas las calificaciones</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>


          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="w-16 sm:w-24 font-semibold text-right flex-shrink-0">Total</div>
              <div className="flex-1 relative h-3 sm:h-4 bg-gray-400 rounded-full overflow-hidden">
                
                <div
                  ref={progressBarRef}
                  className="absolute inset-y-0 left-0 rounded-full bg-yellow-400 transition-all duration-500"
                />
              </div>
              
              <div className="w-12 sm:w-14 font-semibold text-foreground text-left flex-shrink-0">
                <span>{progressPercent.toFixed(0)}%</span>
              </div>
            </div>
            {/* *-------------------------------------* */}
            
          </div>
        </CardContent>
      </Card>
      <Review />
    </div>
  )
}