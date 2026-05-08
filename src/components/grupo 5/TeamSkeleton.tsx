import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex space-x-5 py-5 px-7">
        <Skeleton className="w-30 h-20 rounded-full" />
        <div className="space-y-3 w-full">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TeamSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(9)
        .fill(0)
        .map((_, index) => (
          <TeamCardSkeleton key={index} />
        ))}
    </div>
  )
}
