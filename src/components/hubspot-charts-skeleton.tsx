export function HubSpotChartsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse mr-2"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Row - Two Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lifecycle Stage Chart Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Lead Status Chart Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
              <div className="space-y-2 w-full px-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="h-8 bg-gray-200 rounded animate-pulse flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Leads Over Time Chart Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-44 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-80 bg-gray-100 rounded animate-pulse flex items-end justify-center space-x-1 px-8 pb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-t animate-pulse flex-1"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}