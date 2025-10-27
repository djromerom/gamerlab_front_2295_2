"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import Review from "@/components/grupo 5/Review"

type Rating = { stars: number, count: number }

export default function Scoreboard() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [rawRatings, setRawRatings] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

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
          setRatings([])
          setLoading(false)
          return
        }
        const data = await res.json()

        if (!data || !data.data || !Array.isArray(data.data)) {
          setRawRatings([])
          setRatings([])
          setLoading(false)
          return
        }

        const raw: number[] = data.data.map((item: { evaluationScore: number }) => 
          typeof item.evaluationScore === 'number' ? item.evaluationScore : 0
        );

        setRawRatings(raw)

        const buckets: { [key: number]: number } = {}
        raw.forEach((rating) => {
          const rounded = Math.round(rating * 2) / 2
          buckets[rounded] = (buckets[rounded] || 0) + 1
        })

        const possibleStars = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0]
        const groupedRatings: Rating[] = possibleStars.map((stars) => ({
          stars,
          count: buckets[stars] || 0,
        }))

        setRatings(groupedRatings)
      } catch (error) {
        console.error("Error fetching ratings:", error)
        setRawRatings([])
        setRatings([])
      } finally {
        setLoading(false)
      }

      
    }

    fetchRawRatings()
  }, [])

  const totalRatings = rawRatings.length
  // Fixed NaN issue: ensure we always have valid numbers
  const averageRating = totalRatings === 0 ? "0.0" : (
    rawRatings.reduce((sum, r) => sum + (typeof r === 'number' && !isNaN(r) ? r : 0), 0) / totalRatings
  ).toFixed(2)

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const starSize = size === "sm" ? "w-3 h-3" : "w-4 h-4"
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

  const groupedRatings = [
    { range: "5.0", count: ratings.find((r) => r.stars === 5.0)?.count || 0 },
    { range: "4.5-4.9", count: ratings.filter((r) => r.stars >= 4.5 && r.stars < 5.0).reduce((sum, r) => sum + r.count, 0) },
    { range: "4.0-4.4", count: ratings.filter((r) => r.stars >= 4.0 && r.stars < 4.5).reduce((sum, r) => sum + r.count, 0) },
    { range: "3.0-3.9", count: ratings.filter((r) => r.stars >= 3.0 && r.stars < 4.0).reduce((sum, r) => sum + r.count, 0) },
    { range: "2.0-2.9", count: ratings.filter((r) => r.stars >= 2.0 && r.stars < 3.0).reduce((sum, r) => sum + r.count, 0) },
    { range: "1.0-1.9", count: ratings.filter((r) => r.stars >= 1.0 && r.stars < 2.0).reduce((sum, r) => sum + r.count, 0) },
  ]

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
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{averageRating}</span>
                <div className="flex mt-1">{renderStars(isNaN(Number.parseFloat(averageRating)) ? 0 : Number.parseFloat(averageRating))}</div>
                <span className="text-xs text-foreground mt-1">de 5.0</span>
              </div>
            </div>

            <div className="text-sm text-foreground mt-2 flex items-center">
              <span>Basado en {totalRatings} calificaciones</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1">
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

          <div className="space-y-2">
            {groupedRatings.map((group, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-16 text-sm text-right">{group.range}</div>
                <div className="flex-1 relative h-2 bg-gray-400 rounded-full overflow-hidden ">
                  <div
                    className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full"
                    style={{ width: `${totalRatings === 0 ? 0 : (group.count / totalRatings) * 100}%` }}
                  ></div>
                </div>
                <div className="w-14 text-xs text-gray-500 flex justify-between">
                  <span>{group.count}</span>
                  <span>{totalRatings === 0 ? "0.0" : ((group.count / totalRatings) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Review />
    </div>
  )
}