"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
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
  score: string
  environment: string
  date: string
  onViewFeedback: (id: number) => void
}

const PromptItem = ({ id, rating, score, environment, date, onViewFeedback }: PromptItemProps) => {
  return (
    <Card className="mb-5 overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Califacion</span>
          </div>

          <div className="flex items-center">
            <Badge
              variant={rating === "Excellent" ? "outline" : "secondary"}
              className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
            >
              {rating} {score}
            </Badge>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium">{environment}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onViewFeedback(id)} className="flex items-center gap-1 sm:ml-auto">
            View Feedback
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

  const prompts = [
    {
      id: 1,
      rating: "Excellent",
      score: "5/5",
      environment: "Jurado #1",
      date: "April 17th, 2025",
    },
    {
      id: 2,
      rating: "Excellent",
      score: "5/5",
      environment: "Jurado #2",
      date: "April 17th, 2025",
    },
    {
      id: 3,
      rating: "Excellent",
      score: "5/5",
      environment: "Jurado #3",
      date: "April 6th, 2025",
    },
  ]

  const feedbackData: PromptFeedback[] = [
    {
      id: 1,
      overallRating: "Excellent",
      overallScore: "5/5",
      details: [
        { componentName: "Clarity", score: 5, maxScore: 5 },
        { componentName: "Relevance", score: 5, maxScore: 5 },
        { componentName: "Specificity", score: 5, maxScore: 5 },
        { componentName: "Context", score: 5, maxScore: 5 },
        { componentName: "Format", score: 5, maxScore: 5 },
      ],
      comment:
        "This prompt is exceptionally well-crafted. It provides clear instructions, relevant context, and specific requirements. The format is easy to follow and the context is comprehensive. Excellent work!",
    },
    {
      id: 2,
      overallRating: "Excellent",
      overallScore: "5/5",
      details: [
        { componentName: "Clarity", score: 5, maxScore: 5 },
        { componentName: "Relevance", score: 5, maxScore: 5 },
        { componentName: "Specificity", score: 4, maxScore: 5 },
        { componentName: "Context", score: 5, maxScore: 5 },
        { componentName: "Format", score: 5, maxScore: 5 },
      ],
      comment:
        "Very well structured prompt with clear objectives. The instructions are easy to follow and the context is well defined.",
    },
    {
      id: 3,
      overallRating: "Excellent",
      overallScore: "5/5",
      details: [
        { componentName: "Clarity", score: 5, maxScore: 5 },
        { componentName: "Relevance", score: 5, maxScore: 5 },
        { componentName: "Specificity", score: 5, maxScore: 5 },
        { componentName: "Context", score: 4, maxScore: 5 },
        { componentName: "Format", score: 5, maxScore: 5 },
      ],
      comment:
        "Excellent prompt that achieves its purpose effectively. The instructions are clear and the requirements are well specified.",
    },
  ]

  const handleViewFeedback = (id: number) => {
    const feedback = feedbackData.find((item) => item.id === id)
    if (feedback) {
      setSelectedFeedback(feedback)
      setIsSheetOpen(true)
    }
  }

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
        <SheetContent className="sm:max-w-md p-6">
          <SheetHeader>
            <SheetTitle>Comentarios detallados</SheetTitle>
            <SheetDescription>Comentarios detallados por el jurado #{selectedFeedback?.id}</SheetDescription>
          </SheetHeader>

          {selectedFeedback && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Overall Rating</h3>
                <Badge
                  variant={selectedFeedback.overallRating === "Excellent" ? "outline" : "secondary"}
                  className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                >
                  {selectedFeedback.overallRating} {selectedFeedback.overallScore}
                </Badge>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Component Ratings</h3>
                {selectedFeedback.details.map((detail, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{detail.componentName}</span>
                      <div className="flex items-center">
                        {Array.from({ length: detail.maxScore }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < detail.score ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                          />
                        ))}
                        <span className="ml-2 text-sm">
                          {detail.score}/{detail.maxScore}
                        </span>
                      </div>
                    </div>
                    <Progress value={(detail.score / detail.maxScore) * 100} className="h-2" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Feedback Comment</h3>
                <div className="p-4 bg-muted rounded-md text-sm">{selectedFeedback.comment}</div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
