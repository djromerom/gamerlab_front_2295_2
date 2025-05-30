"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

interface FeedbackDetail {
  score: number
  criterionId: number
  criterionName: string
  criterionWeight: number
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

interface PaginationMetadata {
  totalItems: number
  itemsOnCurrentPage: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
}

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

const PromptItemSkeleton = () => {
  return (
    <Card className="mb-5 overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-3 w-full sm:w-1/4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex items-center justify-start sm:justify-center w-full sm:w-1/4">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="flex flex-col w-full sm:w-1/4 gap-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          
          <Skeleton className="h-9 w-40 sm:ml-auto" />
        </div>
      </CardContent>
    </Card>
  )
}

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
          <Button variant="outline" size="sm" onClick={() => onViewFeedback(id)} className="flex items-center gap-1 sm:ml-auto cursor-pointer">
            Ver Retroalimentación
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const Pagination = ({ metadata, onPageChange, isLoading }: { 
  metadata: PaginationMetadata, 
  onPageChange: (page: number) => void,
  isLoading: boolean
}) => {
  const { currentPage, totalPages } = metadata;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      <div className="flex items-center space-x-1">
        {getVisiblePages().map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                className="w-10 h-10 p-0"
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="flex items-center gap-1"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default function Review() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<PromptFeedback | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [feedbackData, setFeedbackData] = useState<PromptFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [metadata, setMetadata] = useState<PaginationMetadata>({
    totalItems: 0,
    itemsOnCurrentPage: 0,
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1
  })

  const handleViewFeedback = (id: number) => {
    const feedback = feedbackData.find((item) => item.id === id)
    if (feedback) {
      setSelectedFeedback(feedback)
      setIsSheetOpen(true)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const fetchEvaluations = async (page: number, limit: number = 10) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/students?page=${page}&limit=${limit}`, {
        method: "GET",
        credentials: "include",
      })
      
      if (!res.ok) {
        alert("Error fetching ratings")
        return
      }
      
      const response = await res.json()
      
      // Update metadata
      setMetadata(response.metadata)
      
      const transformedPrompts: Prompt[] = response.data.map((item: {
        evaluationComment: string;
        evaluationDate: string;
        evaluationDetails: FeedbackDetail[];
        evaluationId: number;
        evaluationScore: number;
      }, index: number) => ({
        id: item.evaluationId,
        rating: item.evaluationScore >= 3 ? "Excellent" : "Bad",
        score: parseFloat(item.evaluationScore.toFixed(1)),
        date: item.evaluationDate.slice(0, 10),
        environment: `Jurado Anónimo`
      }));
      setPrompts(transformedPrompts)

      const feedbackData: PromptFeedback[] = response.data.map((item: {
        evaluationComment: string;
        evaluationDate: string;
        evaluationDetails: FeedbackDetail[];
        evaluationId: number;
        evaluationScore: number;
      }) => {
        const roundedScore = parseFloat(item.evaluationScore.toFixed(1));

        return {
          id: item.evaluationId,
          overallRating: roundedScore >= 3 ? "Excellent" : "Bad",
          overallScore: `${roundedScore}/5`,
          details: item.evaluationDetails,
          comment: item.evaluationComment,
        };
      });
      setFeedbackData(feedbackData)
    } catch (error) {
      console.error('Error fetching evaluations:', error)
      alert("Error fetching ratings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvaluations(currentPage)
  }, [currentPage])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <PromptItemSkeleton key={index} />
          ))
        ) : (
          prompts.map((prompt) => (
            <PromptItem
              key={prompt.id}
              id={prompt.id}
              rating={prompt.rating}
              score={prompt.score}
              environment={prompt.environment}
              date={prompt.date}
              onViewFeedback={handleViewFeedback}
            />
          ))
        )}
      </div>

      <Pagination 
        metadata={metadata} 
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

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
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium text-foreground leading-tight flex-1 pr-2">
                        {detail.criterionName}
                      </h4>
                      <div className="flex items-center flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < detail.score ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium">
                          {detail.score}/5
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