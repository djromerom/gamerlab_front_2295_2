"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BookOpen, HelpCircle } from "lucide-react"

export default function Scoreboard() {
  // Ahora las calificaciones pueden tener valores decimales
  const ratings = [
    { stars: 5.0, count: 10 },
    { stars: 4.5, count: 6 },
    { stars: 4.0, count: 5 },
    { stars: 3.5, count: 1 },
    { stars: 3.0, count: 1 },
    { stars: 2.5, count: 1 },
    { stars: 2.0, count: 2 },
    { stars: 1.5, count: 0 },
    { stars: 1.0, count: 0 },
  ]

  const totalRatings = ratings.reduce((sum, rating) => sum + rating.count, 0)
  const weightedSum = ratings.reduce((sum, rating) => sum + rating.stars * rating.count, 0)
  const averageRating = (weightedSum / totalRatings).toFixed(1)

  // Función para renderizar estrellas con decimales
  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const starSize = size === "sm" ? "w-3 h-3" : "w-4 h-4"
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`full-${i}`}
          className={`${starSize} text-yellow-400`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>,
      )
    }

    // Media estrella si es necesario
    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          className={`${starSize} text-yellow-400`}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path
            fill="url(#halfGradient)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>,
      )
    }

    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className={`${starSize} text-gray-300`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>,
      )
    }

    return stars
  }

  // Agrupar calificaciones para la visualización
  const groupedRatings = [
    { range: "5.0", count: ratings.find((r) => r.stars === 5.0)?.count || 0 },
    {
      range: "4.5-4.9",
      count: ratings.filter((r) => r.stars >= 4.5 && r.stars < 5.0).reduce((sum, r) => sum + r.count, 0),
    },
    {
      range: "4.0-4.4",
      count: ratings.filter((r) => r.stars >= 4.0 && r.stars < 4.5).reduce((sum, r) => sum + r.count, 0),
    },
    {
      range: "3.0-3.9",
      count: ratings.filter((r) => r.stars >= 3.0 && r.stars < 4.0).reduce((sum, r) => sum + r.count, 0),
    },
    {
      range: "2.0-2.9",
      count: ratings.filter((r) => r.stars >= 2.0 && r.stars < 3.0).reduce((sum, r) => sum + r.count, 0),
    },
    {
      range: "1.0-1.9",
      count: ratings.filter((r) => r.stars >= 1.0 && r.stars < 2.0).reduce((sum, r) => sum + r.count, 0),
    },
  ]

  return (
    <div className="flex w-full max-w-4xl mx-auto p-4">
      <Card className="w-full shadow-sm">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg font-medium text-foreground">Task Submission Feedback</CardTitle>
          <CardDescription className="text-sm text-foreground/50">
            Task submissions are scored against project specifications. View your task feedback below.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32">
              {/* Círculo de fondo */}
              <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>

              {/* Círculo de progreso */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="8"
                  strokeDasharray="289.02652413026095"
                  strokeDashoffset={289.02652413026095 - (289.02652413026095 * Number.parseFloat(averageRating)) / 5}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>

              {/* Valor numérico */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{averageRating}</span>
                <div className="flex mt-1">{renderStars(Number.parseFloat(averageRating))}</div>
                <span className="text-xs text-foreground mt-1">de 5.0</span>
              </div>
            </div>

            <div className="text-sm text-foreground mt-2 flex items-center">
              <span>Basado en {totalRatings} calificaciones</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1">
                      <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
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
                <div className="flex-1 relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full"
                    style={{ width: `${(group.count / totalRatings) * 100}%` }}
                  ></div>
                </div>
                <div className="w-14 text-xs text-gray-500 flex justify-between">
                  <span>{group.count}</span>
                  <span className="text-gray-400">{((group.count / totalRatings) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
