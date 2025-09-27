import { Skeleton } from "@/components/skeleton"

export function HubSpotAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="ml-3 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lifecycle Distribution Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="w-4 h-4 rounded mr-3" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="w-32 h-2 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis Section Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Skeleton className="h-5 w-5 rounded mr-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="text-center py-8">
          <Skeleton className="h-12 w-12 rounded mx-auto mb-3" />
          <Skeleton className="h-4 w-80 mx-auto mb-2" />
          <Skeleton className="h-3 w-64 mx-auto" />
        </div>
      </div>
    </div>
  )
}