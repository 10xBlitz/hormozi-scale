import { Skeleton } from "@/components/skeleton"

export function HubSpotContactsTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-64" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
          <Skeleton className="w-40 h-10 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {/* Contact Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="ml-3 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </td>

                {/* Company Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </td>

                {/* Contact Info Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 mr-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-3 w-3 mr-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </td>

                {/* Stage Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>

                {/* Created Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Skeleton className="h-3 w-3 mr-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </td>

                {/* Last Modified Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Skeleton className="h-3 w-3 mr-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}