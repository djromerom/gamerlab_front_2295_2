"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"

interface FeedbackDetail {
  componentName: string
  score: number
  maxScore: number
}

interface PromptFeedback {
  id: number
  overallRating: string
  overallScore: string
  details: FeedbackDetail[]
  comment: string
}

interface PromptItemProps {
  id: number
  rating: string
  score: number
  environment: string
  date: string
  onViewFeedback: (id: number) => void
}

type Prompt = {
  id: number;
  rating: "Excellent" | "Bad";
  score: number;
  date: string;
  environment: string;
};

const getRatingBadgeClasses = (rating: string) => {
  switch (rating) {
    case "Excellent":
      return "bg-green-50 text-green-700 border-green-200";
    case "Good":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Average":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Bad":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const PromptItem = ({ id, rating, score, environment, date, onViewFeedback }: PromptItemProps) => {
  return (
    <Card className="mb-5 overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-3 w-full sm:w-1/4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Calificacion</span>
          </div>

          <div className="flex items-center justify-start sm:justify-center w-full sm:w-1/4">
            <Badge
              variant={rating === "Excellent" ? "outline" : "secondary"}
              className={getRatingBadgeClasses(rating)}
            >
              {rating} {score}
            </Badge>
          </div>

          <div className="flex flex-col w-full sm:w-1/4">
            <span className="text-sm font-medium">{environment}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onViewFeedback(id)} className="flex items-center gap-1 sm:ml-auto">
            Ver Retroalimentación
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Review() {

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<PromptFeedback | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [feedbackData, setFeedbackData] = useState<PromptFeedback[]>([])


  const handleViewFeedback = (id: number) => {
      const feedback = feedbackData.find((item) => item.id === id)
      if (feedback) {
        setSelectedFeedback(feedback)
        setIsSheetOpen(true)
      }
    }

  useEffect(() => {
    const fetchIndividualRatings = async () => {
      // Simulate fetching individual ratings from an API
      const res = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students`, {
          method: "GET",
          credentials: "include",
      })
      if (!res.ok) {
        alert("Error fetching ratings")
      }
      const data = await res.json()
      
      const transformedPrompts: Prompt[] = data.data.map((item: {
          evaluationComment: string;
          evaluationDate: string;
          evaluationDetails: object[];
          evaluationId: number;
          evaluationScore: number;
        }, index: number) => ({
        id: index + 1,
        rating: item.evaluationScore >= 3 ? "Excellent" : "Bad",
        score: parseFloat(item.evaluationScore.toFixed(1)),
        date: item.evaluationDate.slice(0, 10), // solo los primeros 10 caracteres (AAAA-MM-DD)
        environment: `Jurado #${index + 1}`
      }));
      setPrompts(transformedPrompts)

      const feedbackData: PromptFeedback[] = data.data.map((item: {
          evaluationComment: string;
          evaluationDate: string;
          evaluationDetails: object[];
          evaluationId: number;
          evaluationScore: number;
        }, index: number) => {
        const roundedScore = parseFloat(item.evaluationScore.toFixed(1));

        return {
          id: index + 1,
          overallRating: roundedScore >= 3 ? "Excellent" : "Bad",
          overallScore: `${roundedScore}/5`,
          details: item.evaluationDetails,
          comment: item.evaluationComment,
        };
      });
      setFeedbackData(feedbackData)

    }
    fetchIndividualRatings()
  }, []);
  

  

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <PromptItem
            key={prompt.id}
            id={prompt.id}
            rating={prompt.rating}
            score={prompt.score}
            environment={prompt.environment}
            date={prompt.date}
            onViewFeedback={handleViewFeedback}
          />
        ))}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md p-6 overflow-y-auto max-h-screen">
          <SheetHeader>
            <SheetTitle>Comentarios detallados</SheetTitle>
            <SheetDescription>Comentarios detallados por el jurado #{selectedFeedback?.id}</SheetDescription>
          </SheetHeader>

          {selectedFeedback && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Puntuación General</h3>
                <Badge
                  variant={selectedFeedback.overallRating === "Excellent" ? "outline" : "secondary"}
                  className={getRatingBadgeClasses(selectedFeedback.overallRating)}
                >
                  {selectedFeedback.overallRating} {selectedFeedback.overallScore}
                </Badge>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Puntuaciones por Criterio</h3>
                {selectedFeedback.details.map((detail, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{detail.componentName}</span>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < detail.score ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                          />
                        ))}
                        <span className="ml-2 text-sm">
                          {detail.score}/{5}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={(detail.score / 5) * 100}
                      className="h-2 bg-yellow-100 [&>div]:bg-yellow-500"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Comentarios</h3>
                <div className="p-4 bg-muted rounded-md text-sm">{selectedFeedback.comment}</div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
