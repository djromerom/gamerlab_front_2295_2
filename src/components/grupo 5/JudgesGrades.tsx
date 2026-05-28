"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"

interface JudgeInfo {
  id: string
  nombre: string
  categoria: string
  totalScore: number | null
  haEvaluado: boolean
}

const categoryLabel: Record<string, string> = {
  SENIOR: "Senior",
  JUNIOR: "Junior",
  PROFESOR: "Profesor",
  SIN_CATEGORIA: "—",
}

const categoryColor: Record<string, string> = {
  SENIOR: "bg-blue-100 text-blue-700 border-blue-200",
  JUNIOR: "bg-green-100 text-green-700 border-green-200",
  PROFESOR: "bg-purple-100 text-purple-700 border-purple-200",
  SIN_CATEGORIA: "bg-gray-100 text-gray-500 border-gray-200",
}

export default function JudgesGrades() {
  const [judges, setJudges] = useState<JudgeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchJudges = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/students/my-judges`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        )

        if (!res.ok) {
          setError(true)
          return
        }

        const data = await res.json()
        setJudges(Array.isArray(data) ? data : [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchJudges()
  }, [])

  // Loading skeleton — compact
  if (loading) {
    return (
      <Card className="w-full shadow-sm border">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Error or no team
  if (error) return null

  // No judges assigned
  if (judges.length === 0) {
    return (
      <Card className="w-full shadow-sm border">
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-foreground/50 text-center">
            Aún no hay jurados asignados a tu equipo.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader className="p-3 sm:p-4 pb-1">
        <CardTitle className="text-sm sm:text-base font-medium text-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground/60" />
          Jurados Asignados
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-1">
        {/* Mobile: stacked cards | Desktop: inline rows */}
        <div className="space-y-1.5">
          {judges.map((judge) => (
            <div
              key={judge.id}
              className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors"
            >
              {/* Name + Category */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-medium truncate">
                  {judge.nombre || "Jurado"}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] sm:text-xs px-1.5 py-0 leading-4 shrink-0 ${
                    categoryColor[judge.categoria] ?? categoryColor.SIN_CATEGORIA
                  }`}
                >
                  {categoryLabel[judge.categoria] ?? judge.categoria}
                </Badge>
              </div>

              {/* Score */}
              <span
                className={`text-xs sm:text-sm font-semibold tabular-nums shrink-0 ${
                  judge.haEvaluado
                    ? "text-foreground"
                    : "text-foreground/40 italic"
                }`}
              >
                {judge.haEvaluado && judge.totalScore != null
                  ? judge.totalScore.toFixed(1)
                  : "NA"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
